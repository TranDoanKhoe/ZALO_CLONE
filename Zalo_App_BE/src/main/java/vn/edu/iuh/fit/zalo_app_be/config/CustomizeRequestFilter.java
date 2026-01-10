

package vn.edu.iuh.fit.zalo_app_be.config;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.iuh.fit.zalo_app_be.common.TokenType;
import vn.edu.iuh.fit.zalo_app_be.exception.ErrorResponse;
import vn.edu.iuh.fit.zalo_app_be.service.JwtService;
import vn.edu.iuh.fit.zalo_app_be.service.UserServiceDetail;

import java.io.IOException;
import java.util.Date;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;

@Component
@Slf4j(topic = "CUSTOMIZE-REQUEST-FILTER")
@RequiredArgsConstructor
public class CustomizeRequestFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserServiceDetail userServiceDetail;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        log.info("{} - {} - ContentType: {}", request.getMethod(), request.getRequestURI(), request.getContentType());
        if (request.getRequestURI().startsWith("/ws")) {
            log.debug("WebSocket request, skipping authentication request: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader(AUTHORIZATION);
        if (StringUtils.hasLength(authHeader) && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7).trim();
                log.info("Bearer authHeader: {}", token.substring(0, Math.min(20, token.length())));

                String username = jwtService.extractUsername(token, TokenType.ACCESS_TOKEN);
                log.info("Username: {}", username);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userServiceDetail.userDetailsService().loadUserByUsername(username);
                    if (userDetails == null) {
                        log.error("User not found");
                        sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "User not found");
                        return;
                    }

                    SecurityContext securityContext = SecurityContextHolder.createEmptyContext();

                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    securityContext.setAuthentication(authenticationToken);
                    SecurityContextHolder.setContext(securityContext);
                }

                filterChain.doFilter(request, response);
            } catch (Exception e) {
                log.error("Error processing token: {}", e.getMessage());
                sendErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "Invalid or expired token");
                return;
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Create error response with pretty template
     *
     * @param message
     * @return
     */
    private String errorResponse(String message) {
        try {
            ErrorResponse error = new ErrorResponse();
            error.setTimestamp(new Date());
            error.setError("Forbidden");
            error.setStatus(HttpServletResponse.SC_FORBIDDEN);
            error.setMessage(message);

            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            return gson.toJson(error);
        } catch (Exception e) {
            return "";
        }
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String jsonResponse = String.format("{\"error\": \"%s\"}", message);
        response.getWriter().write(jsonResponse);
    }
}
