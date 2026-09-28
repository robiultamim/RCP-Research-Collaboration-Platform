package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Notification;
import com.rcp.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Notification>>> getUserNotifications(@PathVariable Long userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(new ApiResponse<List<Notification>>(true, "Notifications fetched", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Notification>> createNotification(@RequestBody Notification notification) {
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(new ApiResponse<Notification>(true, "Notification created", saved));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(new ApiResponse<Notification>(true, "Notification marked as read", n));
        }).orElse(ResponseEntity.notFound().build());
    }
}