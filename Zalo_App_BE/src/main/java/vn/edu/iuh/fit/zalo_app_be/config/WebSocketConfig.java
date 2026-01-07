package vn.edu.iuh.fit.zalo_app_be.config;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import vn.edu.iuh.fit.zalo_app_be.common.TokenType;
import vn.edu.iuh.fit.zalo_app_be.service.JwtService;
import vn.edu.iuh.fit.zalo_app_be.service.UserServiceDetail;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j(topic = "WEB-SOCKET-CONFIG")
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtService jwtService;
    private final UserServiceDetail userServiceDetail;

    @Value("${app.frontend.url}")
    private String urlFrontend;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/user", "/queue", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(urlFrontend)
                .setAllowedOriginPatterns("http://localhost:*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                StompCommand command = accessor.getCommand();
                log.info("Command: {}", command);
                String destination = accessor.getDestination();
                String sessionId = accessor.getSessionId();
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                log.debug("Processing STOMP frame: command={}, destination={}, headers={}",
                        command, destination, accessor.getNativeHeader("Authorization"));

                if (command == null) {
                    log.error("Invalid STOMP frame: null command, sessionId={}", sessionId);
                    StompHeaderAccessor error = StompHeaderAccessor.create(StompCommand.ERROR);
                    error.setMessage("Invalid STOMP frame: null command");
                    error.setSessionId(sessionId);
                    return MessageBuilder.createMessage(new byte[0], error.getMessageHeaders());
                }

                if (StompCommand.CONNECT.equals(command) || StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7).trim();
                        try {
                            String username = jwtService.extractUsername(token, TokenType.ACCESS_TOKEN);
                            UserDetails userDetails = userServiceDetail.userDetailsService().loadUserByUsername(username);
                            log.info("Authenticated user: {} for command {}, sessionId = {}", userDetails.getUsername(), command, sessionId);

                            if (userDetails == null) {
                                log.error("User not found for username: {}, sessionId={}", username, sessionId);
                                StompHeaderAccessor error = StompHeaderAccessor.create(StompCommand.ERROR);
                                error.setMessage("User not found");
                                error.setSessionId(sessionId);
                                return MessageBuilder.createMessage(new byte[0], error.getMessageHeaders());
                            }

                            SecurityContextHolder.getContext().setAuthentication(
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities()
                                    )
                            );
                            
                            // Lưu userId vào session attributes để dùng trong event listener
                            if (StompCommand.CONNECT.equals(command)) {
                                String userId = accessor.getFirstNativeHeader("userId");
                                if (userId != null && accessor.getSessionAttributes() != null) {
                                    accessor.getSessionAttributes().put("userId", userId);
                                    log.info("Stored userId in session: {}", userId);
                                }
                            }
                        } catch (Exception e) {
                            StompHeaderAccessor error = StompHeaderAccessor.create(StompCommand.ERROR);
                            error.setMessage("Invalid JWT token: " + e.getMessage());
                            error.setSessionId(accessor.getSessionId());
                            return MessageBuilder.createMessage(new byte[0], error.getMessageHeaders());
                        }
                    } else {
                        log.error("Missing or invalid Authorization header for command {}, sessionId={}: {}",
                                command, sessionId, authHeader);
                        StompHeaderAccessor error = StompHeaderAccessor.create(StompCommand.ERROR);
                        error.setMessage("Missing JWT token");
                        error.setSessionId(sessionId);
                        return MessageBuilder.createMessage(new byte[0], error.getMessageHeaders());
                    }
                }
                log.debug("Forwarding STOMP frame: command={}, destination={}", command, destination);
                return message;
            }
        });
    }
}