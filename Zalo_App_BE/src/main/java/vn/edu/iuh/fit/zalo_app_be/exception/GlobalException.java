

package vn.edu.iuh.fit.zalo_app_be.exception;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

import java.nio.file.AccessDeniedException;
import java.util.Date;

@RestControllerAdvice
public class GlobalException {
    private ErrorResponse errorResponse;

    /**
     * Handle exception when the request is invalid
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler({MethodArgumentNotValidException.class,
            ConstraintViolationException.class,
            MissingServletRequestParameterException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ApiResponses(
            @ApiResponse(responseCode = "400", description = "Bad Request",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "Handle exception when the data invalid. (@RequestBody, @RequestParam, ...)",
                                    summary = "Handle Bad Request",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 400,
                                                "path": "/api/v1/...",
                                                "error": "Invalid Payload",
                                                "message": "{data} must be not blank"
                                            }
                                            """
                            ))})
    )
    public ErrorResponse handleValidationException(Exception e, WebRequest req) {
        errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        String message = e.getMessage();

        if (e instanceof MethodArgumentNotValidException) {
            int start = message.lastIndexOf("[");
            int end = message.lastIndexOf("]");
            message = message.substring((start + 1), end - 1);
            errorResponse.setError("Invalid Payload");
            errorResponse.setMessage(message);
        } else if (e instanceof ConstraintViolationException) {
            message = message.substring(message.indexOf(" ") + 1);
            errorResponse.setError("Invalid Parameter");
            errorResponse.setMessage(message);
        } else if (e instanceof MissingServletRequestParameterException) {
            errorResponse.setError("Invalid Parameter");
            errorResponse.setMessage(message);
        } else {
            errorResponse.setError("Invalid Payload");
            errorResponse.setMessage(message);
        }
        return errorResponse;
    }

    /**
     * Handle exception when the request not found data
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler({ResourceNotFoundException.class,
            BlackListException.class})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ApiResponses(
            @ApiResponse(responseCode = "404", description = "Not Found",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "404 Response",
                                    summary = "Handle Exception when resource not found",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 404,
                                                "path": "/api/v1/...",
                                                "error": "Not Found",
                                                "message": "{data} not found"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleResourceNotFoundException(Exception e, WebRequest req) {
        errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.NOT_FOUND.value());
        errorResponse.setError(HttpStatus.NOT_FOUND.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());

        return errorResponse;
    }

    /**
     * Handle exception when email is invalid
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler(InvalidDataException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ApiResponses(
            @ApiResponse(responseCode = "409", description = "CONFLICT",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "409 Response",
                                    summary = "Handle Exception when resource not found",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 404,
                                                "path": "/api/v1/...",
                                                "error": "Not Found",
                                                "message": "{data} not found"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleEmailExistException(InvalidDataException e, WebRequest req) {
        errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.CONFLICT.value());
        errorResponse.setError(HttpStatus.CONFLICT.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }

    /**
     * Handle exception when the request not found data
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ApiResponses(
            @ApiResponse(responseCode = "403", description = "Forbidden",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "403 Response",
                                    summary = "Handle Exception when forbidden",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 404,
                                                "path": "/api/v1/...",
                                                "error": "Forbidden",
                                                "message": "{data} not found"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleAccessDeniedException(InvalidDataException e, WebRequest req) {
        errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.FORBIDDEN.value());
        errorResponse.setError(HttpStatus.FORBIDDEN.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }

    /**
     * Handle exception when data is existed
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler(DulicatedUserException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ApiResponses(
            @ApiResponse(responseCode = "409", description = "Conflict",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "409 Response",
                                    summary = "Handle Exception when existed",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 409,
                                                "path": "/api/v1/...",
                                                "error": "Conflict",
                                                "message": "{data} not found"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleUserExistedException(DulicatedUserException e, WebRequest req) {
        errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.CONFLICT.value());
        errorResponse.setError(HttpStatus.CONFLICT.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }

    /**
     * Handle exception when token is invalid
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ApiResponses(
            @ApiResponse(responseCode = "401", description = "UNAUTHORIZED",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "401 UNAUTHORIZED",
                                    summary = "Handle Exception when token is invalid",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 401,
                                                "path": "/api/v1/...",
                                                "error": "Not Found",
                                                "message": "{data} not found"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleUnauthorzedException(UnauthorizedException e, WebRequest req) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
        errorResponse.setError(HttpStatus.UNAUTHORIZED.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }

/**
     * Handle exception when send message failed
     *
     * @param e
     * @param req
     * @return
     */
    @ExceptionHandler(MessageSendException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ApiResponses(
            @ApiResponse(responseCode = "412", description = "CLIENT ERROR",
                    content = {@Content(mediaType = APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "412 CLIENT ERROR",
                                    summary = "Handle Exception when send message failed",
                                    value = """
                                            {
                                                "timestamp": "2025-03-29T09:00:00.000+00:00",
                                                "status": 412,
                                                "path": "/api/v1/...",
                                                "error": "Send Message Failed",
                                                "message": "Send Message Failed"
                                            }
                                            """
                            )
                    )})
    )
    public ErrorResponse handleSendMessage(MessageSendException e, WebRequest req) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(req.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(HttpStatus.CONFLICT.value());
        errorResponse.setError(HttpStatus.CONFLICT.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }
}
