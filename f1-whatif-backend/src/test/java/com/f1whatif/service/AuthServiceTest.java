package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.f1whatif.dto.TokenResponse;
import com.f1whatif.entity.AppUser;
import com.f1whatif.entity.Role;
import com.f1whatif.repository.AppUserRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123456";

    private final AppUserRepository users = mock(AppUserRepository.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final SecretKey key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    private final JwtEncoder jwtEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
    private final JwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    private final AuthService service = new AuthService(users, passwordEncoder, jwtEncoder, 60);

    private AppUser userWithId(long id, String username, String password) {
        AppUser user = new AppUser(username, passwordEncoder.encode(password), Role.USER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @Test
    void registerStoresTheUsernameInLowerCaseAndOnlyAHashOfThePassword() {
        when(users.existsByUsername("asad")).thenReturn(false);
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppUser saved = service.register("  Asad ", "correct-horse");

        assertEquals("asad", saved.getUsername());
        assertTrue(!saved.getPasswordHash().equals("correct-horse"));
        assertTrue(passwordEncoder.matches("correct-horse", saved.getPasswordHash()));
        assertEquals(Role.USER, saved.getRole());
    }

    @Test
    void registerRejectsAUsernameThatIsAlreadyTaken() {
        when(users.existsByUsername("asad")).thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.register("asad", "correct-horse"));

        assertEquals(409, error.getStatusCode().value());
    }

    @Test
    void loginReturnsATokenForTheUser() {
        when(users.findByUsername("asad"))
                .thenReturn(Optional.of(userWithId(7, "asad", "correct-horse")));

        TokenResponse token = service.login("Asad", "correct-horse");
        Jwt jwt = jwtDecoder.decode(token.accessToken());

        assertEquals("Bearer", token.tokenType());
        assertEquals(3600L, token.expiresInSeconds());
        assertEquals("7", jwt.getSubject());
        assertEquals("asad", jwt.getClaimAsString("username"));
        assertEquals(List.of("USER"), jwt.getClaimAsStringList("roles"));
    }

    @Test
    void loginRejectsAWrongPassword() {
        when(users.findByUsername("asad"))
                .thenReturn(Optional.of(userWithId(7, "asad", "correct-horse")));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.login("asad", "wrong-password"));

        assertEquals(401, error.getStatusCode().value());
    }

    @Test
    void loginRejectsAnUnknownUsernameWithTheSameError() {
        when(users.findByUsername("nobody")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.login("nobody", "whatever-password"));

        assertEquals(401, error.getStatusCode().value());
        assertEquals("Invalid username or password", error.getReason());
    }
}
