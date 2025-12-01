package com.resolveit.backend.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String firstName;
    private String lastName;
    private String username; // ADD THIS FIELD - user chosen username
    private String email;
    private String password;
    private String role;
    private String phone;
    private Integer departmentId;
}