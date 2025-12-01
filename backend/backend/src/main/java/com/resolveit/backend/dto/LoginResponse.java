package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private String userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String message;

    // Default constructor
    public LoginResponse() {}

    // Constructor for successful login
    public LoginResponse(String token, String userId, String firstName,
                         String lastName, String email, String role) {
        this.token = token;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.message = "Login successful";
    }
}