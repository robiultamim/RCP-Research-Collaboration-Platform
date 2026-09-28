package com.rcp.repository;

import com.rcp.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findBySupervisorId(Long supervisorId);
    List<Project> findByStatus(String status);
}
