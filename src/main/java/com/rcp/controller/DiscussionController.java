package com.rcp.controller;

import com.rcp.dto.ApiResponse;
import com.rcp.model.Discussion;
import com.rcp.model.DiscussionComment;
import com.rcp.repository.DiscussionCommentRepository;
import com.rcp.repository.DiscussionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussions")
@CrossOrigin(origins = "*")
public class DiscussionController {

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionCommentRepository commentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Discussion>>> getAllDiscussions() {
        List<Discussion> list = discussionRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<List<Discussion>>(true, "Discussions fetched", list));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Discussion>>> getDiscussionsByProject(@PathVariable Long projectId) {
        List<Discussion> list = discussionRepository.findByProjectId(projectId);
        return ResponseEntity.ok(new ApiResponse<List<Discussion>>(true, "Project discussions fetched", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Discussion>> createDiscussion(@RequestBody Discussion discussion) {
        Discussion saved = discussionRepository.save(discussion);
        return ResponseEntity.ok(new ApiResponse<Discussion>(true, "Discussion created", saved));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<DiscussionComment>>> getComments(@PathVariable Long id) {
        List<DiscussionComment> comments = commentRepository.findByDiscussionId(id);
        return ResponseEntity.ok(new ApiResponse<List<DiscussionComment>>(true, "Comments fetched", comments));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<DiscussionComment>> addComment(@PathVariable Long id, @RequestBody DiscussionComment comment) {
        comment.setDiscussionId(id);
        DiscussionComment saved = commentRepository.save(comment);
        return ResponseEntity.ok(new ApiResponse<DiscussionComment>(true, "Comment added", saved));
    }
}
