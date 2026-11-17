package com.f1whatif.dto;

public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {
}
