package com.resolveit.backend.controller;

import com.resolveit.backend.dto.RemarkRequestDTO;
import com.resolveit.backend.dto.RemarkResponseDTO;
import com.resolveit.backend.entity.User;
import com.resolveit.backend.repository.UserRepository;
import com.resolveit.backend.service.RemarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF') or hasRole('ADMIN') or hasRole('DEPARTMENT_ADMIN') or hasRole('SUPER_ADMIN')")
public class StaffRemarkController {
    
    private final RemarkService remarkService;
    private final UserRepository userRepository;
    
    @PostMapping("/grievances/{grievanceId}/remarks")
    public ResponseEntity<RemarkResponseDTO> addRemark(
            @PathVariable Long grievanceId,
            @RequestBody RemarkRequestDTO request) {
        
        Long staffId = getCurrentUserId();
        RemarkResponseDTO response = remarkService.addRemark(grievanceId, request, staffId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/grievances/{grievanceId}/remarks")
    public ResponseEntity<List<RemarkResponseDTO>> getRemarks(
            @PathVariable Long grievanceId,
            @RequestParam(defaultValue = "false") boolean includeInternal) {
        
        List<RemarkResponseDTO> remarks = remarkService.getRemarksForGrievance(grievanceId, includeInternal);
        return ResponseEntity.ok(remarks);
    }
    
    @PostMapping("/grievances/{grievanceId}/internal-remarks")
    public ResponseEntity<RemarkResponseDTO> addInternalRemark(
            @PathVariable Long grievanceId,
            @RequestBody RemarkRequestDTO request) {
        
        Long staffId = getCurrentUserId();
        request.setIsInternal(true);
        RemarkResponseDTO response = remarkService.addRemark(grievanceId, request, staffId);
        return ResponseEntity.ok(response);
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String username = authentication.getName();
        
        User user = userRepository.findByUserId(username)
            .orElseGet(() -> userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username)));
        
        return user.getId();
    }
}