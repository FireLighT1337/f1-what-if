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
 * Settings: app.rate-limit.enabled (default true), app.rate-limit.trust-forwarded-for
 * (default false) and app.rate-limit.proxies-to-skip (default 0). Behind a reverse proxy the
 * remote address is the proxy's, so turn trust-forwarded-for on there, but only if the proxy
 * sets X-Forwarded-For itself. The visitor is found counting from the right end of that header
 * (see {@link ClientAddress}); proxies-to-skip is the number of your own proxies in front of
 * the visitor's address, for example 1 when a Vercel rewrite sits in front of Cloud Run.
 */
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitAspect {

    private static final Logger log = LoggerFactory.getLogger(RateLimitAspect.class);

    private final boolean enabled;
    private final boolean trustForwardedFor;
    private final int proxiesToSkip;
    private final ConcurrentMap<String, FixedWindowRateLimiter> limiters = new ConcurrentHashMap<>();

    public RateLimitAspect(@Value("${app.rate-limit.enabled:true}") boolean enabled,
                           @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor,
                           @Value("${app.rate-limit.proxies-to-skip:0}") int proxiesToSkip) {
        this.enabled = enabled;
        this.trustForwardedFor = trustForwardedFor;
        this.proxiesToSkip = proxiesToSkip;
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
        return ClientAddress.of(request.getHeader("X-Forwarded-For"), request.getRemoteAddr(),
                trustForwardedFor, proxiesToSkip);
    }
}
