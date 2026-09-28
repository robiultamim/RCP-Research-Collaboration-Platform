package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Project;
import com.rcp.model.Task;
import com.rcp.model.User;
import com.rcp.repository.ProjectRepository;
import com.rcp.repository.TaskRepository;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TaskRepository taskRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProjects", projectRepository.count());
        stats.put("activeProjects", projectRepository.findByStatus("ACTIVE").size());
        stats.put("totalTasks", taskRepository.count());
        stats.put("socketPort", 9090);
        stats.put("socketStatus", "OPERATIONAL_MULTITHREADED");
        return ResponseEntity.ok(new ApiResponse<Map<String, Object>>(true, "System stats fetched", stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<User>>(true, "All users fetched", users));
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<ApiResponse<User>> suspendUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setStatus("SUSPENDED");
            userRepository.save(u);
            return ResponseEntity.ok(new ApiResponse<User>(true, "User suspended", u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<User>> activateUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            u.setStatus("ACTIVE");
            userRepository.save(u);
            return ResponseEntity.ok(new ApiResponse<User>(true, "User activated", u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Project>>(true, "All projects fetched", projects));
    }

    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<List<Task>>> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Task>>(true, "All tasks fetched", tasks));
    }
}
