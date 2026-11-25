package com.f1whatif.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The username is 3 to 30 letters, digits, dots, underscores or hyphens. BCrypt only looks at the first
 * 72 bytes of a password, hence the upper limit.
 */
public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 30) @Pattern(regexp = "[A-Za-z0-9_.-]*") String username,
        @NotBlank @Size(min = 8, max = 72) String password) {
}
