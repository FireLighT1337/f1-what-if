package com.f1whatif.dto;

import com.f1whatif.entity.AppUser;

public record UserResponse(long id, String username, String role) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name());
    }
}
