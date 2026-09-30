package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.FileResource;
import com.rcp.model.Project;
import com.rcp.model.ProjectMember;
import com.rcp.model.User;
import com.rcp.repository.FileResourceRepository;
import com.rcp.repository.ProjectMemberRepository;
import com.rcp.repository.ProjectRepository;
import com.rcp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileResourceRepository fileRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;

    /**
     * Check if a userId is a member (owner, supervisor, or active member) of a project.
     */
    private boolean isProjectMember(Long projectId, Long userId) {
        Optional<Project> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) return false;
        Project project = projOpt.get();

        // Check owner
        if (userId.equals(project.getOwnerId())) return true;
        // Check supervisor
        if (userId.equals(project.getSupervisorId())) return true;
        // Check active project_members table
        List<ProjectMember> activeMembers = memberRepository.findByProjectIdAndStatus(projectId, "ACTIVE");
        for (ProjectMember pm : activeMembers) {
            if (userId.equals(pm.getUserId())) return true;
        }
        return false;
    }

    /**
     * GET /api/files/project/{projectId}?userId={userId}
     * Returns files for a project. Access is restricted to project members only.
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFilesByProject(
            @PathVariable Long projectId,
            @RequestParam(value = "userId", required = false) Long userId) {

        if (userId != null && !isProjectMember(projectId, userId)) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied. You are not a member of this project.", null));
        }

        List<FileResource> files = fileRepository.findByProjectId(projectId);

        // Enrich with uploader name
        List<Map<String, Object>> result = files.stream().map(f -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("originalFilename", f.getOriginalFilename());
            map.put("filename", f.getFilename());
            map.put("fileType", f.getFileType());
            map.put("fileSize", f.getFileSize());
            map.put("projectId", f.getProjectId());
            map.put("uploaderId", f.getUploaderId());
            map.put("status", f.getStatus());
            map.put("uploadedAt", f.getUploadedAt() != null ? f.getUploadedAt().toString() : null);

            // Get uploader name
            String uploaderName = "Unknown";
            if (f.getUploaderId() != null) {
                Optional<User> uploaderOpt = userRepository.findById(f.getUploaderId());
                if (uploaderOpt.isPresent()) {
                    uploaderName = uploaderOpt.get().getName();
                }
            }
            map.put("uploaderName", uploaderName);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(true, "Files fetched", result));
    }

    /**
     * POST /api/files/upload
     * Upload a file for a project. Must be a project member.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") Long projectId,
            @RequestParam("uploaderId") Long uploaderId) {

        // Verify uploader is a project member
        if (!isProjectMember(projectId, uploaderId)) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied. Only project members can upload files.", null));
        }

        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file_" + System.currentTimeMillis();
            String cleanFileName = originalName.replaceAll("[^a-zA-Z0-9._\\-]", "_");
            String savedPath = UPLOAD_DIR + System.currentTimeMillis() + "_" + cleanFileName;
            File dest = new File(savedPath);
            file.transferTo(dest);

            FileResource resource = new FileResource();
            resource.setFilename(cleanFileName);
            resource.setOriginalFilename(originalName);
            resource.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            resource.setFileSize(file.getSize());
            resource.setFilePath(savedPath);
            resource.setProjectId(projectId);
            resource.setUploaderId(uploaderId);
            resource.setStatus("APPROVED");

            FileResource saved = fileRepository.save(resource);

            // Get uploader name
            String uploaderName = userRepository.findById(uploaderId).map(User::getName).orElse("Unknown");

            Map<String, Object> responseMap = new LinkedHashMap<>();
            responseMap.put("id", saved.getId());
            responseMap.put("originalFilename", saved.getOriginalFilename());
            responseMap.put("filename", saved.getFilename());
            responseMap.put("fileType", saved.getFileType());
            responseMap.put("fileSize", saved.getFileSize());
            responseMap.put("projectId", saved.getProjectId());
            responseMap.put("uploaderId", saved.getUploaderId());
            responseMap.put("uploaderName", uploaderName);
            responseMap.put("status", saved.getStatus());
            responseMap.put("uploadedAt", saved.getUploadedAt() != null ? saved.getUploadedAt().toString() : null);

            return ResponseEntity.ok(new ApiResponse<>(true, "File uploaded successfully", responseMap));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Upload failed: " + e.getMessage(), null));
        }
    }

    /**
     * GET /api/files/download/{id}?userId={userId}
     * Download a file. Access restricted to project members only.
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            @RequestParam(value = "userId", required = false) Long userId) {

        Optional<FileResource> fileOpt = fileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        FileResource f = fileOpt.get();

        // Member access check
        if (userId != null && !isProjectMember(f.getProjectId(), userId)) {
            return ResponseEntity.status(403).build();
        }

        File diskFile = new File(f.getFilePath());
        if (!diskFile.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(diskFile);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + f.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(f.getFileType() != null ? f.getFileType() : "application/octet-stream"))
                .contentLength(diskFile.length())
                .body(resource);
    }

    /**
     * DELETE /api/files/{id}?userId={userId}
     * Delete a file. Only the uploader or project owner can delete.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFile(
            @PathVariable Long id,
            @RequestParam("userId") Long userId) {

        Optional<FileResource> fileOpt = fileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        FileResource f = fileOpt.get();

        // Only the uploader or project owner can delete
        boolean isUploader = userId.equals(f.getUploaderId());
        boolean isOwner = false;
        Optional<Project> projOpt = projectRepository.findById(f.getProjectId());
        if (projOpt.isPresent()) {
            isOwner = userId.equals(projOpt.get().getOwnerId());
        }

        if (!isUploader && !isOwner) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied. Only the file uploader or project owner can delete files.", null));
        }

        // Delete disk file
        File diskFile = new File(f.getFilePath());
        if (diskFile.exists()) {
            diskFile.delete();
        }

        fileRepository.deleteById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "File deleted successfully", "OK"));
    }

    /**
     * GET /api/files?userId={userId}
     * If userId is provided:
     *   - Admin gets all files
     *   - Regular user gets ONLY files uploaded by themselves OR files belonging to projects they belong to
     * If no userId is provided:
     *   - Returns all files (backward compatible for admin)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FileResource>>> getAllFiles(
            @RequestParam(value = "userId", required = false) Long userId) {

        if (userId == null) {
            // Unscoped/unauthenticated requests must NEVER return platform files
            return ResponseEntity.ok(new ApiResponse<>(true, "No user ID specified", new ArrayList<>()));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && "ADMIN".equalsIgnoreCase(userOpt.get().getRole())) {
            List<FileResource> list = fileRepository.findAll();
            return ResponseEntity.ok(new ApiResponse<>(true, "All files fetched for admin", list));
        }

        // Get projects where user is owner, supervisor, or active member
        List<Project> ownerProjects = projectRepository.findByOwnerId(userId);
        List<Project> supervisorProjects = projectRepository.findBySupervisorId(userId);
        List<ProjectMember> memberships = memberRepository.findByUserId(userId);

        Set<Long> userProjectIds = new HashSet<>();
        for (Project p : ownerProjects) userProjectIds.add(p.getId());
        for (Project p : supervisorProjects) userProjectIds.add(p.getId());
        for (ProjectMember pm : memberships) {
            if ("ACTIVE".equalsIgnoreCase(pm.getStatus())) {
                userProjectIds.add(pm.getProjectId());
            }
        }

        List<FileResource> allFiles = fileRepository.findAll();
        List<FileResource> visibleFiles = new ArrayList<>();
        for (FileResource f : allFiles) {
            // User can see file if they uploaded it OR if it belongs to one of their projects
            boolean isUploader = userId.equals(f.getUploaderId());
            boolean isInUserProject = f.getProjectId() != null && userProjectIds.contains(f.getProjectId());
            if (isUploader || isInUserProject) {
                visibleFiles.add(f);
            }
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "User accessible files fetched", visibleFiles));
    }
}