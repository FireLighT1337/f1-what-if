package com.f1whatif.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Turns on Spring's caching annotations. The cache names, size and expiry are set in
 * application.yml (spring.cache.*), and Caffeine is used because it is on the classpath.
 */
@Configuration
@EnableCaching
public class CacheConfig {
}
