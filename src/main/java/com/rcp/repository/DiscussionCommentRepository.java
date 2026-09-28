package com.rcp.repository;

import com.rcp.model.DiscussionComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {
    List<DiscussionComment> findByDiscussionId(Long discussionId);
}
