package vn.edu.iuh.fit.zalo_app_be.exception;

public class MessageSendException extends RuntimeException {
    public MessageSendException(String message) {
        super(message);
    }
}
