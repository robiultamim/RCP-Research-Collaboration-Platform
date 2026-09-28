package com.rcp.repository;

import com.rcp.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssignedUserId(Long assignedUserId);
    List<Task> findByProjectIdAndStatus(Long projectId, String status);
}
