package com.grid07.coreapi.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Handles real-time virality score tracking in Redis.
 * Points: Bot Reply +1, Human Like +20, Human Comment +50
 */
@Service
public class ViralityService {

    private final StringRedisTemplate redis;

    public ViralityService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void addPoints(Long postId, int points) {
        String key = "post:" + postId + ":virality_score";
        redis.opsForValue().increment(key, points);
    }

    public long getScore(Long postId) {
        String key = "post:" + postId + ":virality_score";
        String val = redis.opsForValue().get(key);
        return val != null ? Long.parseLong(val) : 0;
    }
}
