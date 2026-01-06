

package vn.edu.iuh.fit.zalo_app_be.service.impl;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.zalo_app_be.common.TokenType;
import vn.edu.iuh.fit.zalo_app_be.exception.BlackListException;
import vn.edu.iuh.fit.zalo_app_be.exception.InvalidDataException;
import vn.edu.iuh.fit.zalo_app_be.model.BlacklistedToken;
import vn.edu.iuh.fit.zalo_app_be.repository.BlacklistedTokenRepository;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.JwtService;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import static vn.edu.iuh.fit.zalo_app_be.common.TokenType.*;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "JWT-SERVICE")
public class JwtServiceImpl implements JwtService {
    @Value("${jwt.expiryMinutes}")
    private long expiryMinutes;

    @Value("${jwt.expiryDay}")
    private long expiryDay;

    @Value("${jwt.resetPasswordExpiryMinutes}")
    private long resetPasswordExpiryMinutes;

    @Value("${jwt.accessKey}")
    private String accessKey;

    @Value("${jwt.refreshKey}")
    private String refreshKey;

    @Value("${jwt.resetKey}")
    private String resetKey;

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Override
    public String generateAccessToken(String userId, String username) {
        log.info("Generating access token for user: {} ", username);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return generateToken(claims, username, ACCESS_TOKEN);
    }

    @Override
    public String generateRefreshToken(String userId, String username) {
        log.info("Generating refresh token for user: {}", username);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return generateToken(claims, username, REFRESH_TOKEN);
    }

    @Override
    public String generateResetToken(String userId) {
       log.info("Generating reset token for userId: {}", userId);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return generateToken(claims, userId, RESET_TOKEN);
    }


    @Override
    public String extractUsername(String token, TokenType type) {
        log.info("Extracting username from token: {} of type: {}", token, type);

        if (token == null || token.trim().isEmpty()) {
            log.error("Cannot blacklist null or empty token");
            throw new IllegalArgumentException("Token is null or empty");
        }

        if (blacklistedTokenRepository.existsByToken(token)) {
            log.info("Token is blacklisted");
            throw new BlackListException(HttpStatus.NOT_FOUND, "Access Denied, token is blacklisted");
        }

        return extractClaims(type, token, Claims::getSubject);
    }


    @Override
    public void blackListToken(String token, TokenType type) {
        log.info("Blacklisting token: {} of type: {}", token, type);

        LocalDateTime expiryDate = type == TokenType.ACCESS_TOKEN
                ? LocalDateTime.now().plusMinutes(expiryMinutes)
                : LocalDateTime.now().plusDays(expiryDay);

        BlacklistedToken blacklistedToken = new BlacklistedToken(token, expiryDate);
        blacklistedTokenRepository.save(blacklistedToken);
        log.info("Token blacklisted successfully");
    }

    private <T> T extractClaims(TokenType type, String token, Function<Claims, T> claimsExtractor) {
        log.info("--------------[ extractClaims ]--------------");
        final Claims claims = extractAllClaim(type, token);
        return claimsExtractor.apply(claims);
    }

    private Claims extractAllClaim(TokenType type, String token) {
        log.info("--------------[ extractAllClaim ]--------------");
        try {
            return Jwts.parserBuilder().setSigningKey(getKey(type)).build().parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new AccessDeniedException("Access Denied, error: " + e.getMessage());
        }
    }

    private String generateToken(Map<String, Object> claims, String username, TokenType type) {
        log.info("Generating token for subject: {} with claims: {}", username, claims);

        long expiryTime = switch (type) {
            case ACCESS_TOKEN -> 1000 * 60 * expiryMinutes;
            case REFRESH_TOKEN -> 1000 * 60 * 60 * 24 * expiryDay;
            case RESET_TOKEN -> 1000 * 60 * resetPasswordExpiryMinutes;
            default -> throw new IllegalArgumentException("Invalid token type");
        };

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiryTime))
                .signWith(getKey(type))
                .compact();
    }


    private Key getKey(TokenType type) {
        switch (type) {
            case ACCESS_TOKEN -> {
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessKey));
            }
            case REFRESH_TOKEN -> {
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshKey));
            }
            case RESET_TOKEN -> {
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(resetKey));
            }
            default -> throw new InvalidDataException("Invalid token type");
        }
    }

}
