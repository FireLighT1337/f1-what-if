package com.f1whatif.web;

import com.f1whatif.aspect.RateLimited;
import com.f1whatif.dto.LoginRequest;
import com.f1whatif.dto.RegisterRequest;
import com.f1whatif.dto.TokenResponse;
import com.f1whatif.dto.UserResponse;
import com.f1whatif.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** At most 5 new accounts per hour from one address. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @RateLimited(maxRequests = 5, windowSeconds = 3600)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return UserResponse.from(authService.register(request.email(), request.password()));
    }

    /** At most 10 login attempts per minute from one address. */
    @PostMapping("/login")
    @RateLimited(maxRequests = 10, windowSeconds = 60)
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    /**
     * Who the token belongs to. Answered from the token itself, without a database
     * query.
     */
    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        String role = roles == null || roles.isEmpty() ? "USER" : roles.get(0);
        return new UserResponse(CurrentUser.id(jwt), jwt.getClaimAsString("email"), role);
    }
}
