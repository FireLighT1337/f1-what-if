package com.f1whatif.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Measures how long every public service method takes and logs it: at DEBUG normally,
 * at WARN when it is slow.
 *
 * The highest precedence puts this aspect outside the cache and transaction advice,
 * so the time includes a cache lookup and shows what the caller actually waited.
 */
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PerformanceLoggingAspect {

    static final long SLOW_THRESHOLD_MS = 500;

    private static final Logger log = LoggerFactory.getLogger(PerformanceLoggingAspect.class);

    @Around("execution(public * com.f1whatif.service..*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        try {
            return joinPoint.proceed();
        } finally {
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            String method = joinPoint.getSignature().toShortString();
            if (elapsedMs >= SLOW_THRESHOLD_MS) {
                log.warn("{} took {} ms (slow)", method, elapsedMs);
            } else {
                log.debug("{} took {} ms", method, elapsedMs);
            }
        }
    }
}
