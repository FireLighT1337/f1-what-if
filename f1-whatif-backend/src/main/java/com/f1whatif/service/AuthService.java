package com.f1whatif.service;

import com.f1whatif.dto.TokenResponse;
import com.f1whatif.entity.AppUser;
import com.f1whatif.entity.Role;
import com.f1whatif.repository.AppUserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final String ISSUER = "f1-whatif";

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Duration tokenLifetime;
    /** Compared against when the username is unknown, so a login takes about as long either way. */
    private final String dummyHash;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       @Value("${app.security.jwt.expiry-minutes:60}") long expiryMinutes) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.tokenLifetime = Duration.ofMinutes(expiryMinutes);
        this.dummyHash = passwordEncoder.encode("not-a-real-password");
    }

    @Transactional
    public AppUser register(String username, String password) {
        String normalized = normalize(username);
        if (users.existsByUsername(normalized)) {
            throw usernameTaken();
        }
        try {
            return users.saveAndFlush(new AppUser(normalized, passwordEncoder.encode(password), Role.USER));
        } catch (DataIntegrityViolationException e) {
            // Someone registered the same username between the check and the insert.
            throw usernameTaken();
        }
    }

    public TokenResponse login(String username, String password) {
        AppUser user = users.findByUsername(normalize(username)).orElse(null);
        boolean passwordMatches = passwordEncoder.matches(password, user == null ? dummyHash : user.getPasswordHash());
        if (user == null || !passwordMatches) {
            // Same message for an unknown username and a wrong password.
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        return issueToken(user);
    }

    private TokenResponse issueToken(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .issuedAt(now)
                .expiresAt(now.plus(tokenLifetime))
                .subject(String.valueOf(user.getId()))
                .claim("username", user.getUsername())
                .claim("roles", List.of(user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", tokenLifetime.toSeconds());
    }

    private static String normalize(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException usernameTaken() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
    }
}
