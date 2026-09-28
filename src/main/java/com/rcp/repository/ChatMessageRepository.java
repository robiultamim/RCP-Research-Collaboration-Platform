package com.rcp.repository;

import com.rcp.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectIdOrderByTimestampAsc(Long projectId);

    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :u1 AND m.recipientId = :u2) OR (m.senderId = :u2 AND m.recipientId = :u1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findDirectMessages(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.recipientId = :userId ORDER BY m.timestamp DESC")
    List<ChatMessage> findUserMessages(@Param("userId") Long userId);
}
