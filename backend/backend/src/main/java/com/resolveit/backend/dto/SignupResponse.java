package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class SignupResponse {
    private String message;
    private boolean success;
    private String userId;
    private String email;
    private String role;
    
    public SignupResponse(String message, boolean success, String userId, String email, String role) {
        this.message = message;
        this.success = success;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }
    
    public static SignupResponse error(String message) {
        return new SignupResponse(message, false, null, null, null);
    }
    
    public static SignupResponse success(String message, String userId, String email, String role) {
        return new SignupResponse(message, true, userId, email, role);
    }
}