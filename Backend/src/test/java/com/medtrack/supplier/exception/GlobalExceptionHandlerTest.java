package com.medtrack.supplier.exception;

import com.medtrack.supplier.dto.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void testHandleIllegalArgumentException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
        
        IllegalArgumentException ex = new IllegalArgumentException("Invalid argument");
        
        ResponseEntity<ApiErrorResponse> response = handler.handleIllegalArgumentException(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Bad Request", response.getBody().getError());
        assertEquals("Invalid argument", response.getBody().getMessage());
        assertEquals("/api/test", response.getBody().getPath());
    }

    @Test
    void testHandleGenericException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-generic");

        Exception ex = new Exception("Unexpected error");
        
        ResponseEntity<ApiErrorResponse> response = handler.handleGenericException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertEquals("/api/test-generic", response.getBody().getPath());
    }
}
