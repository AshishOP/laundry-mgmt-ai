package com.grid07.coreapi.repository;

import com.grid07.coreapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
