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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Find user by user_id (username)
            Optional<User> userOptional = userRepository.findByUserId(loginRequest.getUsername());
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid username or password"));
            }

            User user = userOptional.get();

            // Check if user is active
            if (!user.getIsActive()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Account is deactivated"));
            }

            // PROPER PASSWORD VALIDATION
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid username or password"));
            }

            // Check role if specified
            if (loginRequest.getRole() != null && !loginRequest.getRole().isEmpty() && 
                !user.getRole().equalsIgnoreCase(loginRequest.getRole())) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("User role doesn't match. Expected: " + user.getRole()));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getUserId(), user.getRole());

            // Return success response
            LoginResponse response = new LoginResponse(
                token, 
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(createErrorResponse("Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        try {
            // Check if username already exists
            if (userRepository.findByUserId(signupRequest.getUsername()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(SignupResponse.error("Username already taken. Please choose a different username."));
            }

            // Check if email already exists
            if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(SignupResponse.error("Email already registered"));
            }

            // Validate username (basic validation)
            if (signupRequest.getUsername() == null || signupRequest.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(SignupResponse.error("Username is required"));
            }

            if (signupRequest.getUsername().length() < 3) {
                return ResponseEntity.badRequest()
                    .body(SignupResponse.error("Username must be at least 3 characters long"));
            }

            if (signupRequest.getUsername().length() > 20) {
                return ResponseEntity.badRequest()
                    .body(SignupResponse.error("Username must be less than 20 characters"));
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

            // Save user to database
            User savedUser = userRepository.save(newUser);

            return ResponseEntity.ok(SignupResponse.success(
                "User registered successfully!",
                savedUser.getUserId(), // Return the chosen username
                savedUser.getEmail(),
                savedUser.getRole()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(SignupResponse.error("Registration failed: " + e.getMessage()));
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