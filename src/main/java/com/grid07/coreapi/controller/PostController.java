package com.grid07.coreapi.controller;

import com.grid07.coreapi.dto.CommentRequest;
import com.grid07.coreapi.dto.LikeRequest;
import com.grid07.coreapi.dto.PostRequest;
import com.grid07.coreapi.model.Comment;
import com.grid07.coreapi.model.Post;
import com.grid07.coreapi.model.PostLike;
import com.grid07.coreapi.service.PostService;
import com.grid07.coreapi.service.ViralityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;
    private final ViralityService viralityService;

    public PostController(PostService postService, ViralityService viralityService) {
        this.postService = postService;
        this.viralityService = viralityService;
    }

    @PostMapping("/posts")
    public ResponseEntity<Post> createPost(@Valid @RequestBody PostRequest request) {
        Post post = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long postId,
            @Valid @RequestBody CommentRequest request) {
        Comment comment = postService.addComment(postId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<PostLike> likePost(@PathVariable Long postId,
            @Valid @RequestBody LikeRequest request) {
        PostLike like = postService.likePost(postId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(like);
    }

    // handy endpoint to check a post's virality score
    @GetMapping("/posts/{postId}/virality")
    public ResponseEntity<Map<String, Object>> getViralityScore(@PathVariable Long postId) {
        long score = viralityService.getScore(postId);
        return ResponseEntity.ok(Map.of(
                "postId", postId,
                "viralityScore", score));
    }
}
