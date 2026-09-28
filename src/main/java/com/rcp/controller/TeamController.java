package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Notification;
import com.rcp.model.Project;
import com.rcp.model.ProjectMember;
import com.rcp.model.User;
import com.rcp.repository.NotificationRepository;
import com.rcp.repository.ProjectMemberRepository;
import com.rcp.repository.ProjectRepository;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/team")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired private ProjectMemberRepository memberRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping("/project/{projectId}/members")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectMembers(@PathVariable Long projectId) {
        Optional<Project> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Project project = projOpt.get();

        Map<String, Object> result = new HashMap<>();
        User owner = project.getOwnerId() != null ? userRepository.findById(project.getOwnerId()).orElse(null) : null;
        User supervisor = project.getSupervisorId() != null ? userRepository.findById(project.getSupervisorId()).orElse(null) : null;

        List<ProjectMember> activeMembers = memberRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
        List<Map<String, Object>> memberList = new ArrayList<>();

        Set<Long> addedUserIds = new HashSet<>();

        if (owner != null) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", owner.getId());
            m.put("name", owner.getName());
            m.put("email", owner.getEmail());
            m.put("role", owner.getRole());
            m.put("department", owner.getDepartment());
            m.put("university", owner.getUniversity());
            m.put("groupRole", "Lead Researcher (Owner)");
            memberList.add(m);
            addedUserIds.add(owner.getId());
        }

        if (supervisor != null && !addedUserIds.contains(supervisor.getId())) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", supervisor.getId());
            m.put("name", supervisor.getName());
            m.put("email", supervisor.getEmail());
            m.put("role", supervisor.getRole());
            m.put("department", supervisor.getDepartment());
            m.put("university", supervisor.getUniversity());
            m.put("groupRole", "Faculty Supervisor");
            memberList.add(m);
            addedUserIds.add(supervisor.getId());
        }

        for (ProjectMember pm : activeMembers) {
            if (!addedUserIds.contains(pm.getUserId())) {
                userRepository.findById(pm.getUserId()).ifPresent(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    m.put("department", u.getDepartment());
                    m.put("university", u.getUniversity());
                    m.put("groupRole", pm.getRoleInProject() != null ? pm.getRoleInProject() : "Researcher");
                    memberList.add(m);
                    addedUserIds.add(u.getId());
                });
            }
        }

        result.put("members", memberList);
        result.put("memberCount", memberList.size());
        result.put("maxCapacity", 6);
        result.put("hasSupervisor", supervisor != null);
        result.put("projectTitle", project.getTitle());

        return ResponseEntity.ok(new ApiResponse<Map<String, Object>>(true, "Project members fetched", result));
    }

    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<Notification>> inviteMember(@RequestBody Map<String, Object> req) {
        Long projectId = Long.valueOf(req.get("projectId").toString());
        Long inviterId = Long.valueOf(req.get("inviterId").toString());
        Long targetUserId = Long.valueOf(req.get("targetUserId").toString());

        Optional<Project> projOpt = projectRepository.findById(projectId);
        Optional<User> targetOpt = userRepository.findById(targetUserId);
        Optional<User> inviterOpt = userRepository.findById(inviterId);

        if (projOpt.isEmpty() || targetOpt.isEmpty() || inviterOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "Invalid project or user data", null));
        }

        Project project = projOpt.get();
        User targetUser = targetOpt.get();
        User inviter = inviterOpt.get();

        // 1. Check if user is already in project
        if (project.getOwnerId() != null && project.getOwnerId().equals(targetUserId)) {
            return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "This user is already the owner of this project group.", null));
        }
        if (project.getSupervisorId() != null && project.getSupervisorId().equals(targetUserId)) {
            return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "This user is already the supervisor of this project group.", null));
        }
        List<ProjectMember> existing = memberRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
        for (ProjectMember pm : existing) {
            if (pm.getUserId().equals(targetUserId)) {
                return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "User is already an active member of this project group.", null));
            }
        }

        // 2. Check Max 6 Members Capacity
        int totalMembers = existing.size() + (project.getOwnerId() != null ? 1 : 0) + (project.getSupervisorId() != null ? 1 : 0);
        if (totalMembers >= 6) {
            return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "Project group is already full! Maximum 6 members allowed.", null));
        }

        // 3. Check 1 Supervisor rule
        if (targetUser.getRole() != null && targetUser.getRole().equalsIgnoreCase("SUPERVISOR")) {
            if (project.getSupervisorId() != null) {
                return ResponseEntity.badRequest().body(new ApiResponse<Notification>(false, "This project group already has a supervisor. Only 1 supervisor allowed per group.", null));
            }
        }

        // Create notification for target user
        Notification notif = new Notification();
        notif.setUserId(targetUserId);
        notif.setSenderId(inviterId);
        notif.setProjectId(projectId);
        notif.setTitle("Project Collaboration Invitation");
        notif.setMessage(inviter.getName() + " invited you to collaborate on research project: '" + project.getTitle() + "'");
        notif.setType("PROJECT_INVITE");
        notif.setStatus("PENDING");

        Notification saved = notificationRepository.save(notif);
        return ResponseEntity.ok(new ApiResponse<Notification>(true, "Invitation sent successfully!", saved));
    }

    @PostMapping("/invitations/{notificationId}/accept")
    public ResponseEntity<ApiResponse<String>> acceptInvitation(@PathVariable Long notificationId) {
        Optional<Notification> notifOpt = notificationRepository.findById(notificationId);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Invitation not found", null));
        }
        Notification notif = notifOpt.get();
        if ("ACCEPTED".equalsIgnoreCase(notif.getStatus())) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Invitation has already been accepted", null));
        }

        Optional<Project> projOpt = projectRepository.findById(notif.getProjectId());
        Optional<User> userOpt = userRepository.findById(notif.getUserId());

        if (projOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Project or user no longer exists", null));
        }

        Project project = projOpt.get();
        User user = userOpt.get();

        // Check Max 6 Members
        List<ProjectMember> existing = memberRepository.findByProjectIdAndStatus(project.getId(), "ACTIVE");
        int totalMembers = existing.size() + (project.getOwnerId() != null ? 1 : 0) + (project.getSupervisorId() != null ? 1 : 0);
        if (totalMembers >= 6) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Cannot join: Project group is full! Maximum 6 members allowed.", null));
        }

        // Check Supervisor exclusivity
        if ("SUPERVISOR".equalsIgnoreCase(user.getRole())) {
            if (project.getSupervisorId() != null && !project.getSupervisorId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Cannot join: This project group already has a supervisor. Only 1 supervisor allowed per group.", null));
            }
            project.setSupervisorId(user.getId());
            projectRepository.save(project);
        } else {
            // Add as student researcher
            ProjectMember member = new ProjectMember();
            member.setProjectId(project.getId());
            member.setUserId(user.getId());
            member.setRoleInProject("RESEARCHER");
            member.setStatus("ACTIVE");
            memberRepository.save(member);
        }

        notif.setStatus("ACCEPTED");
        notif.setIsRead(true);
        notificationRepository.save(notif);

        // Notify inviter
        if (notif.getSenderId() != null) {
            Notification confirm = new Notification();
            confirm.setUserId(notif.getSenderId());
            confirm.setSenderId(user.getId());
            confirm.setProjectId(project.getId());
            confirm.setTitle("Invitation Accepted");
            confirm.setMessage(user.getName() + " accepted your invitation to join '" + project.getTitle() + "'!");
            confirm.setType("INVITE_ACCEPTED");
            confirm.setStatus("ACCEPTED");
            notificationRepository.save(confirm);
        }

        return ResponseEntity.ok(new ApiResponse<String>(true, "Successfully joined project group: " + project.getTitle(), "OK"));
    }

    @PostMapping("/invitations/{notificationId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectInvitation(@PathVariable Long notificationId) {
        Optional<Notification> notifOpt = notificationRepository.findById(notificationId);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Invitation not found", null));
        }
        Notification notif = notifOpt.get();
        notif.setStatus("REJECTED");
        notif.setIsRead(true);
        notificationRepository.save(notif);

        // Notify inviter
        if (notif.getSenderId() != null) {
            Optional<User> userOpt = userRepository.findById(notif.getUserId());
            Optional<Project> projOpt = notif.getProjectId() != null ? projectRepository.findById(notif.getProjectId()) : Optional.empty();
            String userName = userOpt.map(User::getName).orElse("Researcher");
            String projTitle = projOpt.map(Project::getTitle).orElse("your project");

            Notification rej = new Notification();
            rej.setUserId(notif.getSenderId());
            rej.setSenderId(notif.getUserId());
            rej.setProjectId(notif.getProjectId());
            rej.setTitle("Invitation Declined");
            rej.setMessage(userName + " declined the invitation to join '" + projTitle + "'.");
            rej.setType("INVITE_REJECTED");
            rej.setStatus("REJECTED");
            notificationRepository.save(rej);
        }

        return ResponseEntity.ok(new ApiResponse<String>(true, "Invitation declined", "OK"));
    }

    @PostMapping("/leave")
    public ResponseEntity<ApiResponse<String>> leaveProject(@RequestBody Map<String, Object> req) {
        Long projectId = Long.valueOf(req.get("projectId").toString());
        Long userId = Long.valueOf(req.get("userId").toString());

        Optional<Project> projOpt = projectRepository.findById(projectId);
        Optional<User> userOpt = userRepository.findById(userId);

        if (projOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "Project or user not found", null));
        }

        Project project = projOpt.get();
        User user = userOpt.get();

        if (project.getOwnerId() != null && project.getOwnerId().equals(userId)) {
            return ResponseEntity.badRequest().body(new ApiResponse<String>(false, "The project lead/owner cannot leave the group. You can delete or archive the project.", null));
        }

        if (project.getSupervisorId() != null && project.getSupervisorId().equals(userId)) {
            project.setSupervisorId(null);
            projectRepository.save(project);
        }

        List<ProjectMember> members = memberRepository.findByProjectId(projectId);
        for (ProjectMember pm : members) {
            if (pm.getUserId().equals(userId)) {
                memberRepository.delete(pm);
            }
        }

        // Notify owner
        if (project.getOwnerId() != null) {
            Notification leftNotif = new Notification();
            leftNotif.setUserId(project.getOwnerId());
            leftNotif.setSenderId(userId);
            leftNotif.setProjectId(projectId);
            leftNotif.setTitle("Member Left Group");
            leftNotif.setMessage(user.getName() + " has left the project group for '" + project.getTitle() + "'.");
            leftNotif.setType("GENERAL");
            notificationRepository.save(leftNotif);
        }

        return ResponseEntity.ok(new ApiResponse<String>(true, "Successfully left project group", "OK"));
    }
}
