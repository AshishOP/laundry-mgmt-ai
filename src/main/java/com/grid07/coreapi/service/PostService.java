package com.grid07.coreapi.service;

import com.grid07.coreapi.dto.CommentRequest;
import com.grid07.coreapi.dto.LikeRequest;
import com.grid07.coreapi.dto.PostRequest;
import com.grid07.coreapi.exception.RateLimitException;
import com.grid07.coreapi.exception.ResourceNotFoundException;
import com.grid07.coreapi.model.*;
import com.grid07.coreapi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    private final PostRepository postRepo;
    private final CommentRepository commentRepo;
    private final PostLikeRepository likeRepo;
    private final UserRepository userRepo;
    private final BotRepository botRepo;
    private final GuardrailService guardrails;
    private final ViralityService virality;
    private final NotificationService notifications;

    public PostService(PostRepository postRepo, CommentRepository commentRepo,
            PostLikeRepository likeRepo, UserRepository userRepo,
            BotRepository botRepo, GuardrailService guardrails,
            ViralityService virality, NotificationService notifications) {
        this.postRepo = postRepo;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.userRepo = userRepo;
        this.botRepo = botRepo;
        this.guardrails = guardrails;
        this.virality = virality;
        this.notifications = notifications;
    }

    @Transactional
    public Post createPost(PostRequest req) {
        // make sure the author actually exists
        validateAuthorExists(req.getAuthorId(), req.getAuthorType());

        Post post = new Post();
        post.setAuthorId(req.getAuthorId());
        post.setAuthorType(req.getAuthorType());
        post.setContent(req.getContent());
        return postRepo.save(post);
    }

    @Transactional
    public Comment addComment(Long postId, CommentRequest req) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        validateAuthorExists(req.getAuthorId(), req.getAuthorType());

        // figure out depth
        int depth = 1;
        if (req.getParentCommentId() != null) {
            Comment parent = commentRepo.findById(req.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (!parent.getPostId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }
            depth = parent.getDepthLevel() + 1;
        }

        if (req.getAuthorType() == AuthorType.BOT) {
            return handleBotComment(post, req, depth);
        } else {
            return handleHumanComment(post, req, depth);
        }
    }

    @Transactional
    public PostLike likePost(Long postId, LikeRequest req) {
        if (!postRepo.existsById(postId)) {
            throw new ResourceNotFoundException("Post not found with id: " + postId);
        }
        if (!userRepo.existsById(req.getUserId())) {
            throw new ResourceNotFoundException("User not found with id: " + req.getUserId());
        }
        if (likeRepo.existsByPostIdAndUserId(postId, req.getUserId())) {
            throw new IllegalArgumentException("User already liked this post");
        }

        PostLike like = new PostLike();
        like.setPostId(postId);
        like.setUserId(req.getUserId());
        PostLike saved = likeRepo.save(like);

        // human like = +20 virality points
        virality.addPoints(postId, 20);

        return saved;
    }

    // ---- private helpers ----

    private Comment handleBotComment(Post post, CommentRequest req, int depth) {
        // 1) vertical cap
        if (!guardrails.isDepthAllowed(depth)) {
            throw new RateLimitException("Thread depth limit exceeded (max 20 levels)");
        }

        // 2) horizontal cap - atomic Redis check
        if (!guardrails.tryClaimBotSlot(post.getId())) {
            throw new RateLimitException("Bot reply limit reached for this post (max 100)");
        }

        // 3) cooldown - only applies if the post author is a human
        if (post.getAuthorType() == AuthorType.USER) {
            if (!guardrails.tryAcquireCooldown(req.getAuthorId(), post.getAuthorId())) {
                // rollback the slot we just claimed
                guardrails.releaseBotSlot(post.getId());
                throw new RateLimitException(
                        "Cooldown active: this bot already interacted with this user in the last 10 minutes");
            }
        }

        try {
            Comment comment = buildAndSaveComment(post.getId(), req, depth);

            // bot reply = +1 virality point
            virality.addPoints(post.getId(), 1);

            // queue/send notification if the post author is human
            if (post.getAuthorType() == AuthorType.USER) {
                String botName = botRepo.findById(req.getAuthorId())
                        .map(Bot::getName)
                        .orElse("Bot #" + req.getAuthorId());
                notifications.handleBotInteraction(post.getAuthorId(), botName, post.getId());
            }

            return comment;
        } catch (Exception e) {
            // if something goes wrong after we claimed the slot, release it
            guardrails.releaseBotSlot(post.getId());
            throw e;
        }
    }

    private Comment handleHumanComment(Post post, CommentRequest req, int depth) {
        Comment comment = buildAndSaveComment(post.getId(), req, depth);

        // human comment = +50 virality points
        virality.addPoints(post.getId(), 50);

        return comment;
    }

    private Comment buildAndSaveComment(Long postId, CommentRequest req, int depth) {
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorId(req.getAuthorId());
        comment.setAuthorType(req.getAuthorType());
        comment.setContent(req.getContent());
        comment.setDepthLevel(depth);
        comment.setParentCommentId(req.getParentCommentId());
        return commentRepo.save(comment);
    }

    private void validateAuthorExists(Long authorId, AuthorType type) {
        if (type == AuthorType.USER) {
            if (!userRepo.existsById(authorId)) {
                throw new ResourceNotFoundException("User not found with id: " + authorId);
            }
        } else {
            if (!botRepo.existsById(authorId)) {
                throw new ResourceNotFoundException("Bot not found with id: " + authorId);
            }
        }
    }
}
