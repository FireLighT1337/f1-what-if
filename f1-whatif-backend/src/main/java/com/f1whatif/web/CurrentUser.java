package com.f1whatif.web;

import org.springframework.security.oauth2.jwt.Jwt;

/** Reads the logged-in user from the token's claims. */
final class CurrentUser {

    private CurrentUser() {
    }

    static long id(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
