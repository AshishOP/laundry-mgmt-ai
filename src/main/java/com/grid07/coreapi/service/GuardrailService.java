package com.grid07.coreapi.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * All the Redis-backed guardrails live here.
 * Uses Lua scripting for the horizontal cap so it's truly atomic under
 * concurrency.
 */
@Service
public class GuardrailService {

    private static final int MAX_BOT_REPLIES = 100;
    private static final int MAX_THREAD_DEPTH = 20;
    private static final long COOLDOWN_MINUTES = 10;

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> horizontalCapScript;

    public GuardrailService(StringRedisTemplate redis) {
        this.redis = redis;

        // Lua script: atomically increment the counter and check the cap.
        // If we go over, immediately decrement and return 0 (rejected).
        // This guarantees no race condition, even with 200 concurrent requests.
        this.horizontalCapScript = new DefaultRedisScript<>();
        this.horizontalCapScript.setScriptText(
                "local count = redis.call('INCR', KEYS[1]) " +
                        "if count > tonumber(ARGV[1]) then " +
                        "  redis.call('DECR', KEYS[1]) " +
                        "  return 0 " +
                        "end " +
                        "return 1");
        this.horizontalCapScript.setResultType(Long.class);
    }

    /**
     * Tries to claim a bot reply slot for a post. Returns true if under the cap.
     */
    public boolean tryClaimBotSlot(Long postId) {
        String key = "post:" + postId + ":bot_count";
        Long result = redis.execute(horizontalCapScript, List.of(key), String.valueOf(MAX_BOT_REPLIES));
        return result != null && result == 1L;
    }

    /**
     * Rollback a claimed slot if the DB save fails after we already incremented.
     */
    public void releaseBotSlot(Long postId) {
        String key = "post:" + postId + ":bot_count";
        redis.opsForValue().decrement(key);
    }

    /**
     * Simple depth check - no Redis needed for this one.
     */
    public boolean isDepthAllowed(int depth) {
        return depth <= MAX_THREAD_DEPTH;
    }

    /**
     * Sets a 10-minute cooldown between a specific bot and a specific human.
     * Returns true if cooldown was successfully acquired (i.e., no existing
     * cooldown).
     */
    public boolean tryAcquireCooldown(Long botId, Long humanId) {
        String key = "cooldown:bot_" + botId + ":human_" + humanId;
        Boolean wasSet = redis.opsForValue().setIfAbsent(key, "1", Duration.ofMinutes(COOLDOWN_MINUTES));
        return Boolean.TRUE.equals(wasSet);
    }
}
