package com.rcp.repository;

import com.rcp.model.FileResource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileResourceRepository extends JpaRepository<FileResource, Long> {
    List<FileResource> findByProjectId(Long projectId);
    List<FileResource> findByUploaderId(Long uploaderId);
}
