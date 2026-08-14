package com.medtrack.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

/**
 * Stable error envelope for non-validation API failures.
 *
 * <p>The message remains a top-level field for compatibility with existing clients. Request
 * metadata and the correlation id make a sanitized response actionable without returning an
 * exception class, stack trace, SQL statement, or other internal detail.</p>
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    LocalDateTime timestamp;
    int status;
    String error;
    String message;
    String path;
    String correlationId;
}
