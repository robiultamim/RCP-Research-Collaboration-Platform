package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.User;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> list = userRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<User>>(true, "Users fetched", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(new ApiResponse<User>(true, "User found", u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody User req) {
        return userRepository.findById(id).map(u -> {
            if (req.getName() != null) u.setName(req.getName());
            if (req.getDepartment() != null) u.setDepartment(req.getDepartment());
            if (req.getUniversity() != null) u.setUniversity(req.getUniversity());
            if (req.getBio() != null) u.setBio(req.getBio());
            if (req.getSkills() != null) u.setSkills(req.getSkills());
            if (req.getResearchInterests() != null) u.setResearchInterests(req.getResearchInterests());
            userRepository.save(u);
            // Update localStorage data too by returning full user
            return ResponseEntity.ok(new ApiResponse<User>(true, "Profile updated", u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return userRepository.findById(id).map(u -> {
            u.setStatus(status);
            userRepository.save(u);
            return ResponseEntity.ok(new ApiResponse<User>(true, "Status updated", u));
        }).orElse(ResponseEntity.notFound().build());
    }
}
