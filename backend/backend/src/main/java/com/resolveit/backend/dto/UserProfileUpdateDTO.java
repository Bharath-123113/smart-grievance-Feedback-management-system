package com.resolveit.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UserProfileUpdateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Integer departmentId;
    
    // Student info
    private String enrollmentNumber;
    private String address;
    private String academicYear;
    private String program;
    private Integer semester;
    private BigDecimal gpa; // Changed to BigDecimal
}