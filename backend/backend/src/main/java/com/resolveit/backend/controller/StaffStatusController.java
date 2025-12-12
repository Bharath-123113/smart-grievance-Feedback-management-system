// package com.resolveit.backend.controller;

// import com.resolveit.backend.dto.StatusUpdateRequest;
// import com.resolveit.backend.entity.User;
// import com.resolveit.backend.repository.UserRepository;
// import com.resolveit.backend.service.StatusUpdateService;
// import lombok.RequiredArgsConstructor;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.web.bind.annotation.*;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/dashboard/staff")
// @RequiredArgsConstructor
// @PreAuthorize("hasAnyAuthority('STAFF', 'staff', 'ROLE_STAFF', 'ROLE_staff')")
// public class StaffStatusController {
    
//     private final StatusUpdateService statusUpdateService;
//     private final UserRepository userRepository;
    
//     @PutMapping("/grievances/{grievanceId}/status")
//     public ResponseEntity<Map<String, String>> updateGrievanceStatus(
//             @PathVariable Long grievanceId,
//             @RequestBody StatusUpdateRequest request) {
        
//         Long staffId = getCurrentUserId();
        
//         statusUpdateService.updateGrievanceStatus(grievanceId, request, staffId);
        
//         return ResponseEntity.ok(Map.of(
//             "message", "Grievance status updated successfully",
//             "grievanceId", grievanceId.toString(),
//             "newStatus", request.getStatus()
//         ));
//     }
    
//     private Long getCurrentUserId() {
//         Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//         String username = authentication.getName();
        
//         User user = userRepository.findByUserId(username)
//             .orElseGet(() -> userRepository.findByEmail(username)
//                 .orElseThrow(() -> new RuntimeException("User not found")));
        
//         return user.getId();
//     }
// }