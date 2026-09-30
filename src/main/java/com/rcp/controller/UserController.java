package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.ChatMessage;
import com.rcp.model.Project;
import com.rcp.model.ProjectMember;
import com.rcp.model.Task;
import com.rcp.model.User;
import com.rcp.repository.ChatMessageRepository;
import com.rcp.repository.ProjectMemberRepository;
import com.rcp.repository.ProjectRepository;
import com.rcp.repository.TaskRepository;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository memberRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> list = userRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<User>>(true, "Users fetched", list));
    }

    @GetMapping("/{id}/dashboard-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDashboardStats(@PathVariable Long id) {
        Map<String, Object> stats = new HashMap<>();

        // 1. User's active projects (owner, supervisor, or active member)
        List<Project> ownerProjects = projectRepository.findByOwnerId(id);
        List<Project> supervisorProjects = projectRepository.findBySupervisorId(id);
        List<ProjectMember> memberships = memberRepository.findByUserId(id);

        Set<Long> userProjectIds = new HashSet<>();
        for (Project p : ownerProjects) {
            if ("ACTIVE".equalsIgnoreCase(p.getStatus())) {
                userProjectIds.add(p.getId());
            }
        }
        for (Project p : supervisorProjects) {
            if ("ACTIVE".equalsIgnoreCase(p.getStatus())) {
                userProjectIds.add(p.getId());
            }
        }
        for (ProjectMember pm : memberships) {
            if ("ACTIVE".equalsIgnoreCase(pm.getStatus())) {
                projectRepository.findById(pm.getProjectId()).ifPresent(p -> {
                    if ("ACTIVE".equalsIgnoreCase(p.getStatus())) {
                        userProjectIds.add(p.getId());
                    }
                });
            }
        }
        stats.put("activeProjects", userProjectIds.size());

        // 2. User's tasks
        List<Task> tasks = taskRepository.findByAssignedUserId(id);
        int pendingTasks = 0;
        int completedTasks = 0;
        for (Task t : tasks) {
            if ("COMPLETED".equalsIgnoreCase(t.getStatus())) {
                completedTasks++;
            } else {
                pendingTasks++;
            }
        }
        stats.put("pendingTasks", pendingTasks);
        stats.put("completedTasks", completedTasks);

        // 3. Messages count involving user
        List<ChatMessage> userMessages = chatMessageRepository.findUserMessages(id);
        stats.put("messagesCount", userMessages != null ? userMessages.size() : 0);

        return ResponseEntity.ok(new ApiResponse<>(true, "User dashboard stats fetched", stats));
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
