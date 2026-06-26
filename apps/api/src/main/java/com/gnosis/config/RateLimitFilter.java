package com.gnosis.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> queryBuckets = new ConcurrentHashMap<>();
    private final int publicCapacity;
    private final int publicRefillPerMinute;
    private final int queryCapacity;
    private final int queryRefillPerMinute;

    public RateLimitFilter(
            @Value("${rate-limiting.public.capacity}") int publicCapacity,
            @Value("${rate-limiting.public.refill-per-minute}") int publicRefillPerMinute,
            @Value("${rate-limiting.query.capacity}") int queryCapacity,
            @Value("${rate-limiting.query.refill-per-minute}") int queryRefillPerMinute
    ) {
        this.publicCapacity = publicCapacity;
        this.publicRefillPerMinute = publicRefillPerMinute;
        this.queryCapacity = queryCapacity;
        this.queryRefillPerMinute = queryRefillPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (path.startsWith("/api/v1/auth/")) {
            String clientIp = getClientIp(request);
            Bucket bucket = authBuckets.computeIfAbsent(clientIp,
                    k -> newBucket(publicCapacity, publicRefillPerMinute));
            if (!bucket.tryConsume(1)) {
                writeTooManyRequests(response);
                return;
            }
        } else if (path.startsWith("/api/v1/query") && "POST".equals(request.getMethod())) {
            String clientIp = getClientIp(request);
            Bucket bucket = queryBuckets.computeIfAbsent(clientIp,
                    k -> newBucket(queryCapacity, queryRefillPerMinute));
            if (!bucket.tryConsume(1)) {
                writeTooManyRequests(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Bucket newBucket(int capacity, int refillPerMinute) {
        Bandwidth limit = Bandwidth.classic(capacity, Refill.greedy(refillPerMinute, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Try again later.\"}");
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) {
            return xri;
        }
        return request.getRemoteAddr();
    }
}
