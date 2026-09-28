package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.*;
import com.rcp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired private TaskRepository taskRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectMemberRepository memberRepository;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Task>>> getAllTasks() {
        List<Task> list = taskRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Task>>(true, "All tasks fetched", list));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Task>>> getTasksByProject(@PathVariable Long projectId) {
        List<Task> list = taskRepository.findByProjectId(projectId);
        return ResponseEntity.ok(new ApiResponse<List<Task>>(true, "Tasks fetched", list));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Task>>> getTasksByUser(@PathVariable Long userId) {
        List<Task> list = taskRepository.findByAssignedUserId(userId);
        return ResponseEntity.ok(new ApiResponse<List<Task>>(true, "User tasks fetched", list));
    }

    /**
     * Get tasks for current user:
     * - Tasks explicitly assigned to this user
     * - Tasks for any project where the user is an owner, supervisor, or active member
     * Returns enriched metadata (projectName, assignedUserName)
     */
    @GetMapping("/my/{userId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyProjectTasks(@PathVariable Long userId) {
        // 1. Identify user's projects
        boolean isAdmin = false;
        Optional<User> uOpt = userRepository.findById(userId);
        if (uOpt.isPresent() && "ADMIN".equalsIgnoreCase(uOpt.get().getRole())) {
            isAdmin = true;
        }

        Set<Long> userProjectIds = new HashSet<>();
        for (Project p : projectRepository.findAll()) {
            if (isAdmin || userId.equals(p.getOwnerId()) || userId.equals(p.getSupervisorId())) {
                userProjectIds.add(p.getId());
            } else {
                List<ProjectMember> members = memberRepository.findByProjectIdAndStatus(p.getId(), "ACTIVE");
                for (ProjectMember pm : members) {
                    if (userId.equals(pm.getUserId())) {
                        userProjectIds.add(p.getId());
                        break;
                    }
                }
            }
        }

        // 2. Fetch all tasks and filter
        List<Task> allTasks = taskRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        Map<Long, String> projectTitleCache = new HashMap<>();
        Map<Long, String> userNameCache = new HashMap<>();

        for (Task t : allTasks) {
            boolean isAssigned = userId.equals(t.getAssignedUserId());
            boolean isProjectMember = t.getProjectId() != null && userProjectIds.contains(t.getProjectId());

            if (isAssigned || isProjectMember) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", t.getId());
                map.put("title", t.getTitle());
                map.put("description", t.getDescription());
                map.put("projectId", t.getProjectId());
                map.put("assignedUserId", t.getAssignedUserId());
                map.put("priority", t.getPriority() != null ? t.getPriority() : "MEDIUM");
                map.put("status", t.getStatus() != null ? t.getStatus() : "TODO");
                map.put("deadline", t.getDeadline());
                map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);

                // Project name
                if (t.getProjectId() != null) {
                    String pTitle = projectTitleCache.computeIfAbsent(t.getProjectId(), pid ->
                            projectRepository.findById(pid).map(Project::getTitle).orElse("Project #" + pid));
                    map.put("projectName", pTitle);
                } else {
                    map.put("projectName", "General");
                }

                // Assigned user name
                if (t.getAssignedUserId() != null) {
                    String uName = userNameCache.computeIfAbsent(t.getAssignedUserId(), uid ->
                            userRepository.findById(uid).map(User::getName).orElse("User #" + uid));
                    map.put("assignedUserName", uName);
                } else {
                    map.put("assignedUserName", "Unassigned");
                }

                result.add(map);
            }
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "User project tasks fetched", result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Task>> createTask(@RequestBody Task task) {
        if (task.getStatus() == null) task.setStatus("TODO");
        if (task.getPriority() == null) task.setPriority("MEDIUM");
        Task saved = taskRepository.save(task);

        // Notify assigned user if assigned to someone
        if (saved.getAssignedUserId() != null) {
            try {
                String projName = "Project";
                if (saved.getProjectId() != null) {
                    projName = projectRepository.findById(saved.getProjectId())
                            .map(Project::getTitle).orElse("Project");
                }
                Notification notif = new Notification();
                notif.setUserId(saved.getAssignedUserId());
                notif.setProjectId(saved.getProjectId());
                notif.setTitle("New Task Assigned");
                notif.setMessage("You were assigned a new task: '" + saved.getTitle() + "' in " + projName + ".");
                notif.setType("TASK_ASSIGNED");
                notif.setStatus("UNREAD");
                notificationRepository.save(notif);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(new ApiResponse<Task>(true, "Task created successfully", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Task>> updateTask(@PathVariable Long id, @RequestBody Task req) {
        return taskRepository.findById(id).map(t -> {
            if (req.getTitle() != null) t.setTitle(req.getTitle());
            if (req.getDescription() != null) t.setDescription(req.getDescription());
            if (req.getStatus() != null) t.setStatus(req.getStatus());
            if (req.getPriority() != null) t.setPriority(req.getPriority());
            if (req.getDeadline() != null) t.setDeadline(req.getDeadline());
            if (req.getAssignedUserId() != null) t.setAssignedUserId(req.getAssignedUserId());
            taskRepository.save(t);
            return ResponseEntity.ok(new ApiResponse<Task>(true, "Task updated", t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Task>> updateTaskStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            jakarta.servlet.http.HttpServletRequest request) {

        String newStatus = status;
        if (newStatus == null || newStatus.trim().isEmpty()) {
            try {
                String body = new String(request.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                if (body != null && !body.trim().isEmpty()) {
                    if (body.contains("\"status\"")) {
                        int idx = body.indexOf("\"status\"");
                        int colon = body.indexOf(":", idx);
                        int quote1 = body.indexOf("\"", colon);
                        int quote2 = body.indexOf("\"", quote1 + 1);
                        if (quote1 != -1 && quote2 != -1) {
                            newStatus = body.substring(quote1 + 1, quote2);
                        }
                    } else if (body.contains("status=")) {
                        newStatus = body.substring(body.indexOf("status=") + 7).trim();
                        if (newStatus.contains("&")) newStatus = newStatus.substring(0, newStatus.indexOf("&"));
                    }
                }
            } catch (Exception ignored) {}
        }

        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Status is required", null));
        }

        final String finalStatus = newStatus.trim().toUpperCase().replace(" ", "_");
        return taskRepository.findById(id).map(t -> {
            t.setStatus(finalStatus);
            Task saved = taskRepository.save(t);
            return ResponseEntity.ok(new ApiResponse<Task>(true, "Task status updated to " + finalStatus, saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse<String>(true, "Task deleted", "OK"));
    }
}
