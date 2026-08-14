package com.medtrack.exception;

import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that client mistakes keep useful 4xx responses while unexpected backend failures are
 * classified as 500 and never disclose their exception messages.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private static final String CORRELATION_ID = "error-test-correlation-id";

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("POST", "/api/equipment/42");
        MDC.put("correlationId", CORRELATION_ID);
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    public void dummyMethod(String dummy) {
    }

    @Test
    void validationErrorsRemainFieldAddressableAndKeepFirstMessage() throws NoSuchMethodException {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("equipment", "name", "Name is required"),
                new FieldError("equipment", "name", "Name is too short"),
                new FieldError("equipment", "quantity", "Quantity must be positive")));
        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getMethod("dummyMethod", String.class), 0);

        ResponseEntity<ValidationErrorResponse> response = handler.handleValidationExceptions(
                new MethodArgumentNotValidException(parameter, bindingResult));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Validation failed", response.getBody().getMessage());
        assertEquals("Name is required", response.getBody().getErrors().get("name"));
        assertEquals("Quantity must be positive", response.getBody().getErrors().get("quantity"));
    }

    @Test
    void badCredentialsRemainUnauthorizedWithCompatibleMessage() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBadCredentials(
                new BadCredentialsException("Invalid credentials"), request);

        assertError(response, HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @Test
    void resourceNotFoundRemainsNotFound() {
        ResponseEntity<ApiErrorResponse> response = handler.handleResourceNotFound(
                new ResourceNotFoundException("Equipment not found"), request);

        assertError(response, HttpStatus.NOT_FOUND, "Equipment not found");
    }

    @Test
    void accessDeniedDoesNotExposeSecurityExceptionDetail() {
        ResponseEntity<ApiErrorResponse> response = handler.handleAccessDenied(
                new AccessDeniedException("Missing privileged authority ROLE_HOSPITAL"), request);

        assertError(response, HttpStatus.FORBIDDEN, "Access denied");
        assertFalse(response.getBody().getMessage().contains("ROLE_HOSPITAL"));
    }

    @Test
    void illegalArgumentsRemainBadRequests() {
        ResponseEntity<ApiErrorResponse> response = handler.handleIllegalArgument(
                new IllegalArgumentException("Quantity must be positive"), request);

        assertError(response, HttpStatus.BAD_REQUEST, "Quantity must be positive");
    }

    @Test
    void businessStateRejectionsKeepExistingBadRequestContract() {
        ResponseEntity<ApiErrorResponse> response = handler.handleIllegalState(
                new IllegalStateException("Completed work order cannot be reopened"), request);

        assertError(response, HttpStatus.BAD_REQUEST, "Completed work order cannot be reopened");
    }

    @Test
    void malformedJsonIsAClientErrorWithoutParserDetails() {
        HttpMessageNotReadableException exception = new HttpMessageNotReadableException(
                "JSON parse error: Cannot deserialize internal.model.Secret", mock(HttpInputMessage.class));

        ResponseEntity<ApiErrorResponse> response = handler.handleUnreadableMessage(exception, request);

        assertError(response, HttpStatus.BAD_REQUEST, "Malformed JSON request");
        assertFalse(response.getBody().getMessage().contains("internal.model.Secret"));
    }

    @Test
    void missingRequestParameterNamesThePublicParameter() {
        ResponseEntity<ApiErrorResponse> response = handler.handleMissingParameter(
                new MissingServletRequestParameterException("keepId", "Long"), request);

        assertError(response, HttpStatus.BAD_REQUEST, "Missing required parameter 'keepId'");
    }

    @Test
    void typeMismatchNamesThePublicParameterWithoutConversionInternals() throws Exception {
        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getMethod("dummyMethod", String.class), 0);
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "not-a-number", Long.class, "equipmentId", parameter, new NumberFormatException("secret"));

        ResponseEntity<ApiErrorResponse> response = handler.handleTypeMismatch(exception, request);

        assertError(response, HttpStatus.BAD_REQUEST, "Invalid value for parameter 'equipmentId'");
    }

    @Test
    void unsupportedMethodRetainsProtocolStatus() {
        ResponseEntity<ApiErrorResponse> response = handler.handleMethodNotSupported(
                new HttpRequestMethodNotSupportedException("TRACE"), request);

        assertError(response, HttpStatus.METHOD_NOT_ALLOWED, "Request method is not supported");
    }

    @Test
    void unsupportedMediaTypeRetainsProtocolStatus() {
        ResponseEntity<ApiErrorResponse> response = handler.handleMediaTypeNotSupported(
                new HttpMediaTypeNotSupportedException("application/x-java-object"), request);

        assertError(response, HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content type is not supported");
    }

    @Test
    void dataIntegrityFailuresReturnSanitizedConflict() {
        ResponseEntity<ApiErrorResponse> response = handler.handlePersistenceConflict(
                new DataIntegrityViolationException(
                        "Unique index violation on USERS(EMAIL) values ('patient@example.org')"), request);

        assertError(response, HttpStatus.CONFLICT,
                "The request conflicts with the current resource state");
        assertFalse(response.getBody().getMessage().contains("patient@example.org"));
    }

    @Test
    void optimisticLockFailuresReturnSanitizedConflict() {
        ResponseEntity<ApiErrorResponse> response = handler.handlePersistenceConflict(
                new OptimisticLockException("Version 7 was stale for equipment 42"), request);

        assertError(response, HttpStatus.CONFLICT,
                "The request conflicts with the current resource state");
        assertFalse(response.getBody().getMessage().contains("Version 7"));
    }

    @Test
    void unexpectedRuntimeFailureReturnsSanitizedInternalServerError() {
        ResponseEntity<ApiErrorResponse> response = handler.handleRuntimeException(
                new NullPointerException("Cannot invoke repository.save because connectionPool is null"), request);

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        assertFalse(response.getBody().getMessage().contains("connectionPool"));
    }

    @Test
    void checkedFailureReturnsSameSanitizedInternalServerError() {
        ResponseEntity<ApiErrorResponse> response = handler.handleGeneralException(
                new Exception("Filesystem path /private/medtrack/export.csv is unavailable"), request);

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        assertFalse(response.getBody().getMessage().contains("/private/medtrack"));
    }

    @Test
    void correlationIdIsOptionalOutsideAFilteredRequest() {
        MDC.clear();

        ResponseEntity<ApiErrorResponse> response = handler.handleRuntimeException(
                new RuntimeException("internal detail"), request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNull(response.getBody().getCorrelationId());
    }

    private void assertError(
            ResponseEntity<ApiErrorResponse> response, HttpStatus expectedStatus, String expectedMessage) {
        assertEquals(expectedStatus, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getTimestamp());
        assertEquals(expectedStatus.value(), response.getBody().getStatus());
        assertEquals(expectedStatus.getReasonPhrase(), response.getBody().getError());
        assertEquals(expectedMessage, response.getBody().getMessage());
        assertEquals("/api/equipment/42", response.getBody().getPath());
        assertEquals(CORRELATION_ID, response.getBody().getCorrelationId());
    }
}
