package com.resolveit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupResponse {
    private boolean success;
    private String message;
    
    // Static helper methods
    public static SignupResponse success(String message) {
        return new SignupResponse(true, message);
    }
    
    public static SignupResponse error(String message) {
        return new SignupResponse(false, message);
    }
    
    public static SignupResponse success(String message, String username, String email, String role) {
        return new SignupResponse(true, 
            message + " Username: " + username + ", Email: " + email + ", Role: " + role);
    }
}