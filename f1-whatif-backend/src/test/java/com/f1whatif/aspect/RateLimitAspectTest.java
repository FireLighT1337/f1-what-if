package com.f1whatif.aspect;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class RateLimitAspectTest {

    @RateLimited(maxRequests = 2, windowSeconds = 60)
    void limitedMethod() {
    }

    private final RateLimited annotation = annotationOnLimitedMethod();

    private static RateLimited annotationOnLimitedMethod() {
        try {
            return RateLimitAspectTest.class.getDeclaredMethod("limitedMethod").getAnnotation(RateLimited.class);
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ProceedingJoinPoint joinPoint() throws Throwable {
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        Signature signature = mock(Signature.class);
        when(signature.toShortString()).thenReturn("AuthController.login(..)");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.proceed()).thenReturn("ok");
        return joinPoint;
    }

    private static void requestFrom(String address, String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(address);
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void callsTheMethodWhileUnderTheLimit() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, false, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("1.1.1.1", null);

        assertEquals("ok", aspect.limit(joinPoint, annotation));
        assertEquals("ok", aspect.limit(joinPoint, annotation));

        verify(joinPoint, times(2)).proceed();
    }

    @Test
    void rejectsWithTooManyRequestsOnceTheLimitIsReached() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, false, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("1.1.1.1", null);
        aspect.limit(joinPoint, annotation);
        aspect.limit(joinPoint, annotation);

        TooManyRequestsException error = assertThrows(TooManyRequestsException.class,
                () -> aspect.limit(joinPoint, annotation));

        assertEquals(429, error.getStatusCode().value());
        assertNotNull(error.getHeaders().getFirst("Retry-After"));
        verify(joinPoint, times(2)).proceed();
    }

    @Test
    void countsEachAddressSeparately() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, false, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("1.1.1.1", null);
        aspect.limit(joinPoint, annotation);
        aspect.limit(joinPoint, annotation);

        requestFrom("2.2.2.2", null);

        assertEquals("ok", aspect.limit(joinPoint, annotation));
    }

    @Test
    void usesTheLastForwardedAddressWhenItIsTrusted() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, true, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        // Different proxy addresses and forged first hops, but the same address added by the proxy.
        requestFrom("10.0.0.1", "6.6.6.6, 9.9.9.9");
        aspect.limit(joinPoint, annotation);
        requestFrom("10.0.0.2", "7.7.7.7, 9.9.9.9");
        aspect.limit(joinPoint, annotation);
        requestFrom("10.0.0.3", "8.8.8.8, 9.9.9.9");

        assertThrows(TooManyRequestsException.class, () -> aspect.limit(joinPoint, annotation));
    }

    @Test
    void ignoresTheForwardedHeaderUnlessItIsTrusted() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, false, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("1.1.1.1", "5.5.5.5");
        aspect.limit(joinPoint, annotation);
        aspect.limit(joinPoint, annotation);
        requestFrom("1.1.1.1", "6.6.6.6");

        assertThrows(TooManyRequestsException.class, () -> aspect.limit(joinPoint, annotation));
    }

    @Test
    void doesNothingWhenDisabled() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(false, false, 0);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("1.1.1.1", null);

        for (int i = 0; i < 5; i++) {
            assertEquals("ok", aspect.limit(joinPoint, annotation));
        }
    }

    @Test
    void callsTheMethodWhenThereIsNoRequest() throws Throwable {
        RateLimitAspect aspect = new RateLimitAspect(true, false, 0);

        assertEquals("ok", aspect.limit(joinPoint(), annotation));
    }

    @Test
    void skipsTheProxiesInFrontWhenTheVisitorIsFurtherLeftInTheHeader() throws Throwable {
        // The last entry is added by the second proxy (for example Vercel); the visitor is the one before it.
        RateLimitAspect aspect = new RateLimitAspect(true, true, 1);
        ProceedingJoinPoint joinPoint = joinPoint();
        requestFrom("10.0.0.1", "1.1.1.1, 203.0.113.7");
        aspect.limit(joinPoint, annotation);
        requestFrom("10.0.0.2", "1.1.1.1, 203.0.113.8");
        aspect.limit(joinPoint, annotation);
        requestFrom("10.0.0.3", "1.1.1.1, 203.0.113.9");

        assertThrows(TooManyRequestsException.class, () -> aspect.limit(joinPoint, annotation));
    }
}
