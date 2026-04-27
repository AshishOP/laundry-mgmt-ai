package com.grid07.coreapi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Handles notification throttling for bot interactions.
 * Instead of spamming the user every time a bot does something,
 * we batch them up and send a summary later via the CRON sweeper.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final long NOTIF_COOLDOWN_MINUTES = 15;

    private final StringRedisTemplate redis;

    public NotificationService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Called whenever a bot interacts with a human's post.
     * If the user was recently notified, we queue it. Otherwise, send immediately.
     */
    public void handleBotInteraction(Long userId, String botName, Long postId) {
        String cooldownKey = "user:" + userId + ":notif_cooldown";
        String pendingKey = "user:" + userId + ":pending_notifs";

        boolean recentlyNotified = Boolean.TRUE.equals(redis.hasKey(cooldownKey));

        if (recentlyNotified) {
            // user already got a notification recently, just queue this one
            String message = botName + " replied to your post #" + postId;
            redis.opsForList().rightPush(pendingKey, message);
            log.debug("Queued notification for user {}: {}", userId, message);
        } else {
            // no recent notification - send it right away and set cooldown
            log.info("Push Notification Sent to User {}: {} interacted with your post #{}", userId, botName, postId);
            redis.opsForValue().set(cooldownKey, "1", Duration.ofMinutes(NOTIF_COOLDOWN_MINUTES));
        }
    }
}
