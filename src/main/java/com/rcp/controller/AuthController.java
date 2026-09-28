package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.dto.LoginRequest;
import com.rcp.dto.RegisterRequest;
import com.rcp.model.User;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(new ApiResponse<User>(false, "Email already exists", null));
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        user.setRole(req.getRole() != null ? req.getRole().toUpperCase() : "STUDENT");
        user.setDepartment(req.getDepartment());
        user.setUniversity(req.getUniversity());
        user.setBio(req.getBio());
        if (req.getSkills() != null) user.setSkills(req.getSkills());
        if (req.getResearchInterests() != null) user.setResearchInterests(req.getResearchInterests());

        User saved = userRepository.save(user);
        return ResponseEntity.ok(new ApiResponse<User>(true, "User registered successfully", saved));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<User>> login(@RequestBody LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(new ApiResponse<User>(false, "Invalid credentials", null));
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(req.getPassword())) {
            return ResponseEntity.status(401).body(new ApiResponse<User>(false, "Invalid password", null));
        }

        return ResponseEntity.ok(new ApiResponse<User>(true, "Login successful", user));
    }
}
