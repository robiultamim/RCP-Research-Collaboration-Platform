package com.rcp.repository;

import com.rcp.model.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    List<Discussion> findByProjectId(Long projectId);
    List<Discussion> findByIsPinnedTrue();
}
