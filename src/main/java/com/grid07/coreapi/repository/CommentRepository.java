package com.grid07.coreapi.repository;

import com.grid07.coreapi.model.AuthorType;
import com.grid07.coreapi.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostId(Long postId);

    long countByPostIdAndAuthorType(Long postId, AuthorType authorType);
}
