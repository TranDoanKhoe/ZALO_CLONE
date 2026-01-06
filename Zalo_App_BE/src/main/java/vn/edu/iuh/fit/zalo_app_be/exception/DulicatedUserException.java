package vn.edu.iuh.fit.zalo_app_be.exception;

public class DulicatedUserException extends RuntimeException {
    public DulicatedUserException(String message) {
        super(message);
    }
}
