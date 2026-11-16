package com.f1whatif.aspect;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.Test;

class PerformanceLoggingAspectTest {

    private final PerformanceLoggingAspect aspect = new PerformanceLoggingAspect();

    private static ProceedingJoinPoint joinPoint() {
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        Signature signature = mock(Signature.class);
        when(signature.toShortString()).thenReturn("StandingsService.standings(..)");
        when(joinPoint.getSignature()).thenReturn(signature);
        return joinPoint;
    }

    @Test
    void returnsTheResultOfTheAdvisedMethod() throws Throwable {
        ProceedingJoinPoint joinPoint = joinPoint();
        when(joinPoint.proceed()).thenReturn("result");

        Object result = aspect.logExecutionTime(joinPoint);

        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    void rethrowsExceptionsFromTheAdvisedMethod() throws Throwable {
        ProceedingJoinPoint joinPoint = joinPoint();
        when(joinPoint.proceed()).thenThrow(new IllegalStateException("boom"));

        assertThrows(IllegalStateException.class, () -> aspect.logExecutionTime(joinPoint));
    }
}
