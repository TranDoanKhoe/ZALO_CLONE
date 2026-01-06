package vn.edu.iuh.fit.zalo_app_be.exception;

import org.springframework.http.HttpStatus;

public class BlackListException extends RuntimeException {
    public BlackListException(HttpStatus notFound, String message) {
        super(message);
    }
}
