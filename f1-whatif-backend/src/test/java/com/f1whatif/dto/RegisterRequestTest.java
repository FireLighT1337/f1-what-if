package com.f1whatif.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.params.provider.MethodSource;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;

import java.util.stream.Stream;

class RegisterRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private int violations(String username, String password) {
        return validator.validate(new RegisterRequest(username, password)).size();
    }

    @ParameterizedTest
    @MethodSource("validUsernames")
    void acceptsLettersDigitsDotsUnderscoresAndHyphens(String username) {
        assertEquals(0, violations(username, "correct-horse"));
    }

    static Stream<String> validUsernames() {
        return Stream.of(
                "asad",
                "Asad_1337",
                "a.b-c",
                "abc",
                "a".repeat(30));
    }

    @ParameterizedTest
    @MethodSource("invalidUsernames")
    void rejectsUsernamesThatAreTooShortTooLongOrUseOtherCharacters(String username) {
        assertTrue(violations(username, "correct-horse") > 0);
    }

    static Stream<String> invalidUsernames() {
        return Stream.of(
                "ab",
                "a".repeat(31),
                "has space",
                "asad@example.com",
                "ümlaut",
                " asad",
                "name!");
    }

    @Test
    void rejectsABlankUsernameAndAShortPassword() {
        assertTrue(violations("", "correct-horse") > 0);
        assertTrue(violations("asad", "short") > 0);
    }
}
