package vn.edu.iuh.fit.zalo_app_be.exception;

public class InvalidDataException extends RuntimeException {
    public InvalidDataException(String message) {
        super(message);
    }
}
