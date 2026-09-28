package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Project;
import com.rcp.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired private ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        List<Project> list = projectRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Project>>(true, "Projects fetched", list));
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
