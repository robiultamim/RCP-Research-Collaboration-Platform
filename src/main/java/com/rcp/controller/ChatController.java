package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.*;
import com.rcp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired private ChatMessageRepository chatRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository memberRepository;
    @Autowired private NotificationRepository notificationRepository;

    /**
     * Get 1-on-1 direct messages between two users
     */
    @GetMapping("/direct")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getDirectMessages(
            @RequestParam Long user1,
            @RequestParam Long user2) {
        List<ChatMessage> messages = chatRepository.findDirectMessages(user1, user2);
        return ResponseEntity.ok(new ApiResponse<>(true, "Direct messages fetched", messages));
    }

    /**
     * Get messages for a project channel
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getProjectMessages(@PathVariable Long projectId) {
        List<ChatMessage> messages = chatRepository.findByProjectIdOrderByTimestampAsc(projectId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Project messages fetched", messages));
    }

    /**
     * Send a new message (either direct to recipientId or to a projectId channel)
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(@RequestBody ChatMessage req) {
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Message cannot be empty", null));
        }

        // Fill sender name if missing
        if (req.getSenderName() == null && req.getSenderId() != null) {
            userRepository.findById(req.getSenderId()).ifPresent(u -> req.setSenderName(u.getName()));
        }

        // Fill recipient name if direct chat
        if (req.getRecipientId() != null && req.getRecipientName() == null) {
            userRepository.findById(req.getRecipientId()).ifPresent(u -> req.setRecipientName(u.getName()));
        }

        ChatMessage saved = chatRepository.save(req);

        // If direct message, send a notification to recipient
        if (req.getRecipientId() != null && !req.getRecipientId().equals(req.getSenderId())) {
            try {
                Notification notif = new Notification();
                notif.setUserId(req.getRecipientId());
                notif.setSenderId(req.getSenderId());
                notif.setTitle("New Message from " + (req.getSenderName() != null ? req.getSenderName() : "User"));
                String preview = req.getMessage().length() > 50 ? req.getMessage().substring(0, 47) + "..." : req.getMessage();
                notif.setMessage(preview);
                notif.setType("CHAT");
                notif.setStatus("UNREAD");
                notificationRepository.save(notif);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", saved));
    }

    /**
     * Get all contacts (registered users) for 1-on-1 chatting
     */
    @GetMapping("/contacts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getContacts(
            @RequestParam(required = false) Long currentUserId) {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (User u : users) {
            if (currentUserId != null && u.getId().equals(currentUserId)) {
                continue; // exclude oneself from contact list
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("department", u.getDepartment());
            map.put("university", u.getUniversity());

            // Fetch last direct message snippet if currentUserId provided
            if (currentUserId != null) {
                List<ChatMessage> direct = chatRepository.findDirectMessages(currentUserId, u.getId());
                if (!direct.isEmpty()) {
                    ChatMessage last = direct.get(direct.size() - 1);
                    map.put("lastMessage", last.getMessage());
                    map.put("lastMessageTime", last.getTimestamp());
                } else {
                    map.put("lastMessage", null);
                    map.put("lastMessageTime", null);
                }
            }
            list.add(map);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Contacts fetched", list));
    }

    /**
     * Get all project channels where the user is a member/owner/supervisor
     */
    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjectRooms(
            @RequestParam Long userId) {
        List<Project> allProjects = projectRepository.findAll();
        List<Map<String, Object>> rooms = new ArrayList<>();

        for (Project p : allProjects) {
            boolean isMember = false;
            if (userId.equals(p.getOwnerId()) || userId.equals(p.getSupervisorId())) {
                isMember = true;
            } else {
                List<ProjectMember> members = memberRepository.findByProjectIdAndStatus(p.getId(), "ACTIVE");
                for (ProjectMember pm : members) {
                    if (userId.equals(pm.getUserId())) {
                        isMember = true;
                        break;
                    }
                }
            }

            if (isMember) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("id", p.getId());
                r.put("title", p.getTitle());
                r.put("researchArea", p.getResearchArea());
                r.put("status", p.getStatus());
                // Fetch last project message
                List<ChatMessage> msgs = chatRepository.findByProjectIdOrderByTimestampAsc(p.getId());
                if (!msgs.isEmpty()) {
                    ChatMessage last = msgs.get(msgs.size() - 1);
                    r.put("lastMessage", last.getSenderName() + ": " + last.getMessage());
                    r.put("lastMessageTime", last.getTimestamp());
                } else {
                    r.put("lastMessage", "Start team discussion...");
                    r.put("lastMessageTime", null);
                }
                rooms.add(r);
            }
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Project rooms fetched", rooms));
    }
}
