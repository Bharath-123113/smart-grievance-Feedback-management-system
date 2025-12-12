package com.resolveit.backend.controller;

import com.resolveit.backend.dto.LoginRequest;
import com.resolveit.backend.dto.LoginResponse;
import com.resolveit.backend.dto.SignupRequest;
import com.resolveit.backend.dto.SignupResponse;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("🔐 LOGIN ATTEMPT for username: " + loginRequest.getUsername());
            System.out.println("🎭 Requested role: " + loginRequest.getRole());
            
            // Find user by user_id (username)
            Optional<User> userOptional = userRepository.findByUserId(loginRequest.getUsername());
            
            if (userOptional.isEmpty()) {
                System.out.println("❌ USER NOT FOUND: " + loginRequest.getUsername());
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid username or password"));
            }

            User user = userOptional.get();
            System.out.println("✅ USER FOUND: " + user.getUserId() + ", Role: " + user.getRole());
            System.out.println("🔐 User active? " + user.getIsActive());

            // Check if user is active
            if (!user.getIsActive()) {
                System.out.println("❌ ACCOUNT DEACTIVATED: " + user.getUserId());
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Account is deactivated"));
            }

            // PROPER PASSWORD VALIDATION
            System.out.println("🔑 Password check for: " + user.getUserId());
            boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash());
            System.out.println("✅ Password matches? " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("❌ PASSWORD MISMATCH for: " + user.getUserId());
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid username or password"));
            }

            // Check role if specified
            if (loginRequest.getRole() != null && !loginRequest.getRole().isEmpty()) {
                System.out.println("🎭 Checking role: Expected=" + user.getRole() + ", Received=" + loginRequest.getRole());
                if (!user.getRole().equalsIgnoreCase(loginRequest.getRole())) {
                    System.out.println("❌ ROLE MISMATCH: Expected " + user.getRole() + " but got " + loginRequest.getRole());
                    return ResponseEntity.badRequest()
                        .body(createErrorResponse("User role doesn't match. Expected: " + user.getRole()));
                }
            }

            // Try authentication with Spring Security
            try {
                System.out.println("🔐 Attempting Spring Security authentication...");
                Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                        user.getUserId(), // Use user_id for authentication
                        loginRequest.getPassword()
                    )
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ Spring Security authentication successful");
            } catch (Exception authException) {
                System.out.println("⚠️ Spring Security authentication failed: " + authException.getMessage());
                System.out.println("⚠️ Continuing with manual authentication...");
                // Continue without Spring Security authentication
                // This might happen if UserDetailsService is not properly configured
            }

            // Generate JWT token with user_id as username
            String token = jwtUtil.generateToken(user.getUserId(), user.getRole());
            System.out.println("🎫 JWT Token generated for: " + user.getUserId());

            // Create login response
            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUserId(user.getUserId());
            response.setEmail(user.getEmail());
            response.setRole(user.getRole());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            
            // Set department info if exists
            if (user.getDepartmentId() != null) {
                response.setDepartmentId(user.getDepartmentId());
            }
            
            // CHECK IF STUDENT HAS COMPLETED PROFILE
            if ("student".equalsIgnoreCase(user.getRole())) {
                // Check if student has enrollment number
                boolean hasCompletedProfile = 
                    user.getEnrollmentNumber() != null && !user.getEnrollmentNumber().trim().isEmpty();
                
                response.setProfileCompleted(hasCompletedProfile);
                
                System.out.println("🎯 Student profile check for " + user.getUserId() + ": " + hasCompletedProfile);
                System.out.println("📝 Enrollment Number: " + user.getEnrollmentNumber());
            } else {
                // For staff and admin, profile is always considered complete
                response.setProfileCompleted(true);
                System.out.println("✅ " + user.getRole() + " user - profile complete");
            }

            System.out.println("🎉 LOGIN SUCCESSFUL for: " + user.getUserId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ LOGIN ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(createErrorResponse("Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        try {
            System.out.println("📝 SIGNUP ATTEMPT for username: " + signupRequest.getUsername());
            
            // Check if username already exists
            if (userRepository.findByUserId(signupRequest.getUsername()).isPresent()) {
                System.out.println("❌ USERNAME TAKEN: " + signupRequest.getUsername());
                return ResponseEntity.badRequest()
                    .body(new SignupResponse(false, "Username already taken. Please choose a different username."));
            }

            // Check if email already exists
            if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
                System.out.println("❌ EMAIL TAKEN: " + signupRequest.getEmail());
                return ResponseEntity.badRequest()
                    .body(new SignupResponse(false, "Email already registered"));
            }

            // Validate username (basic validation)
            if (signupRequest.getUsername() == null || signupRequest.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new SignupResponse(false, "Username is required"));
            }

            if (signupRequest.getUsername().length() < 3) {
                return ResponseEntity.badRequest()
                    .body(new SignupResponse(false, "Username must be at least 3 characters long"));
            }

            if (signupRequest.getUsername().length() > 20) {
                return ResponseEntity.badRequest()
                    .body(new SignupResponse(false, "Username must be less than 20 characters"));
            }

            // Create new user with chosen username
            User newUser = new User();
            newUser.setUserId(signupRequest.getUsername()); // Use chosen username as user_id
            newUser.setFirstName(signupRequest.getFirstName());
            newUser.setLastName(signupRequest.getLastName());
            newUser.setEmail(signupRequest.getEmail());
            newUser.setPasswordHash(passwordEncoder.encode(signupRequest.getPassword()));
            newUser.setRole(signupRequest.getRole());
            newUser.setPhone(signupRequest.getPhone());
            newUser.setDepartmentId(signupRequest.getDepartmentId());
            newUser.setIsActive(true);
            
            // FOR STUDENTS: Set temporary enrollment number so they can login immediately
            if ("student".equalsIgnoreCase(signupRequest.getRole())) {
                newUser.setEnrollmentNumber("TEMP-" + signupRequest.getUsername());
                System.out.println("🎓 New student created with temporary enrollment: TEMP-" + signupRequest.getUsername());
            }

            // Save user to database
            User savedUser = userRepository.save(newUser);
            System.out.println("✅ USER CREATED: " + savedUser.getUserId() + ", Role: " + savedUser.getRole());

            return ResponseEntity.ok(new SignupResponse(true, 
                "User registered successfully! Username: " + savedUser.getUserId() + 
                ", Email: " + savedUser.getEmail() + ", Role: " + savedUser.getRole()));

        } catch (Exception e) {
            System.err.println("❌ SIGNUP ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new SignupResponse(false, "Registration failed: " + e.getMessage()));
        }
    }

    // Helper method to create error responses
    private LoginResponse createErrorResponse(String message) {
        LoginResponse response = new LoginResponse();
        response.setMessage(message);
        return response;
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("Invalid authorization header");
            }

            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);
                
                return ResponseEntity.ok().body("Token is valid for user: " + username + ", role: " + role);
            } else {
                return ResponseEntity.badRequest().body("Invalid token");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Token validation failed: " + e.getMessage());
        }
    }
}