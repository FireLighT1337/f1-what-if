package com.f1whatif.aspect;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Enforces {@link RateLimited}. Clients are told apart by IP address; the addresses are only
 * kept in memory for the length of the window and are never logged.
 *
 * Settings: app.rate-limit.enabled (default true) and app.rate-limit.trust-forwarded-for
 * (default false). Behind a reverse proxy the remote address is the proxy's, so turn the
 * second one on there, but only if the proxy sets X-Forwarded-For itself; the last address
 * in that header is the one the proxy added, and the earlier ones can be forged by clients.
 */
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitAspect {

    private static final Logger log = LoggerFactory.getLogger(RateLimitAspect.class);

    private final boolean enabled;
    private final boolean trustForwardedFor;
    private final ConcurrentMap<String, FixedWindowRateLimiter> limiters = new ConcurrentHashMap<>();

    public RateLimitAspect(@Value("${app.rate-limit.enabled:true}") boolean enabled,
                           @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor) {
        this.enabled = enabled;
        this.trustForwardedFor = trustForwardedFor;
    }

    @Around("@annotation(rateLimited)")
    public Object limit(ProceedingJoinPoint joinPoint, RateLimited rateLimited) throws Throwable {
        HttpServletRequest request = enabled ? currentRequest() : null;
        if (request != null) {
            String endpoint = joinPoint.getSignature().toShortString();
            FixedWindowRateLimiter limiter = limiters.computeIfAbsent(endpoint, name ->
                    new FixedWindowRateLimiter(rateLimited.maxRequests(),
                            Duration.ofSeconds(rateLimited.windowSeconds()), System::nanoTime));

            FixedWindowRateLimiter.Decision decision = limiter.tryAcquire(clientKey(request));
            if (!decision.allowed()) {
                log.warn("Rate limit exceeded on {}", endpoint);
                throw new TooManyRequestsException(decision.retryAfterSeconds());
            }
        }
        return joinPoint.proceed();
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        return attributes instanceof ServletRequestAttributes servlet ? servlet.getRequest() : null;
    }

    private String clientKey(HttpServletRequest request) {
        if (trustForwardedFor) {
            String header = request.getHeader("X-Forwarded-For");
            if (header != null && !header.isBlank()) {
                String[] hops = header.split(",");
                return hops[hops.length - 1].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
