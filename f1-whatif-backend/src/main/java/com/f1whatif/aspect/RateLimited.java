package com.f1whatif.aspect;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Limits how often one client can call a method: at most maxRequests per window.
 * Handled by {@link RateLimitAspect}; going over the limit gives a 429 response.
 */
@Documented
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    int maxRequests() default 10;

    int windowSeconds() default 60;
}
