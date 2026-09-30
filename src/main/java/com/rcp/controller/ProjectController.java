package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Project;
import com.rcp.model.ProjectMember;
import com.rcp.model.User;
import com.rcp.repository.ProjectMemberRepository;
import com.rcp.repository.ProjectRepository;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository memberRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        List<Project> list = projectRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Project>>(true, "Projects fetched", list));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Project>>> getUserProjects(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && "ADMIN".equalsIgnoreCase(userOpt.get().getRole())) {
            List<Project> all = projectRepository.findAll();
            return ResponseEntity.ok(new ApiResponse<>(true, "All projects for admin", all));
        }

        // 1. Projects where user is owner
        List<Project> ownerProjects = projectRepository.findByOwnerId(userId);

        // 2. Projects where user is supervisor
        List<Project> supervisorProjects = projectRepository.findBySupervisorId(userId);

        // 3. Projects where user is active team member
        List<ProjectMember> memberships = memberRepository.findByUserId(userId);
        Set<Long> memberProjectIds = new HashSet<>();
        for (ProjectMember pm : memberships) {
            if ("ACTIVE".equalsIgnoreCase(pm.getStatus())) {
                memberProjectIds.add(pm.getProjectId());
            }
        }

        // Combine unique projects maintaining insertion order
        Map<Long, Project> uniqueMap = new LinkedHashMap<>();
        for (Project p : ownerProjects) {
            uniqueMap.put(p.getId(), p);
        }
        for (Project p : supervisorProjects) {
            uniqueMap.put(p.getId(), p);
        }
        for (Long pid : memberProjectIds) {
            if (!uniqueMap.containsKey(pid)) {
                projectRepository.findById(pid).ifPresent(p -> uniqueMap.put(p.getId(), p));
            }
        }

        List<Project> result = new ArrayList<>(uniqueMap.values());
        return ResponseEntity.ok(new ApiResponse<>(true, "User enrolled projects fetched", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(p -> ResponseEntity.ok(new ApiResponse<Project>(true, "Project found", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<Project>>> getProjectsByOwner(@PathVariable Long ownerId) {
        List<Project> list = projectRepository.findByOwnerId(ownerId);
        return ResponseEntity.ok(new ApiResponse<List<Project>>(true, "Owner projects fetched", list));
    }

    @GetMapping("/supervisor/{supervisorId}")
    public ResponseEntity<ApiResponse<List<Project>>> getProjectsBySupervisor(@PathVariable Long supervisorId) {
        List<Project> list = projectRepository.findBySupervisorId(supervisorId);
        return ResponseEntity.ok(new ApiResponse<List<Project>>(true, "Supervised projects fetched", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> createProject(@RequestBody Project project) {
        if (project.getStatus() == null) project.setStatus("ACTIVE");
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(new ApiResponse<Project>(true, "Project created", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> updateProject(@PathVariable Long id, @RequestBody Project req) {
        return projectRepository.findById(id).map(p -> {
            if (req.getTitle() != null) p.setTitle(req.getTitle());
            if (req.getDescription() != null) p.setDescription(req.getDescription());
            if (req.getResearchArea() != null) p.setResearchArea(req.getResearchArea());
            if (req.getStatus() != null) p.setStatus(req.getStatus());
            if (req.getDeadline() != null) p.setDeadline(req.getDeadline());
            projectRepository.save(p);
            return ResponseEntity.ok(new ApiResponse<Project>(true, "Project updated", p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Project>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return projectRepository.findById(id).map(p -> {
            p.setStatus(status);
            projectRepository.save(p);
            return ResponseEntity.ok(new ApiResponse<Project>(true, "Status updated", p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable Long id) {
        projectRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse<String>(true, "Project deleted", "OK"));
    }
}
