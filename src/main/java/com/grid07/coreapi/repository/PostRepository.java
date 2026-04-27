package com.grid07.coreapi.repository;

import com.grid07.coreapi.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
}
