package com.grid07.coreapi.dto;

import com.grid07.coreapi.model.AuthorType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentRequest {

    @NotNull(message = "authorId is required")
    private Long authorId;

    @NotNull(message = "authorType is required (USER or BOT)")
    private AuthorType authorType;

    @NotBlank(message = "content cannot be empty")
    private String content;

    private Long parentCommentId; // optional - null means top-level comment
}
