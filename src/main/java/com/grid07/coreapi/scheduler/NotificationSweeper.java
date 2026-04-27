package com.grid07.coreapi.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * CRON job that runs every 5 minutes.
 * Picks up any pending bot-interaction notifications from Redis,
 * summarizes them, and logs the push notification.
 */
@Component
public class NotificationSweeper {

    private static final Logger log = LoggerFactory.getLogger(NotificationSweeper.class);

    private final StringRedisTemplate redis;

    public NotificationSweeper(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Scheduled(fixedRate = 300_000) // every 5 minutes
    public void sweepPendingNotifications() {
        // find all users that have pending notifications
        Set<String> keys = redis.keys("user:*:pending_notifs");

        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            // extract user id from the key pattern user:{id}:pending_notifs
            String userId = key.split(":")[1];

            // pop everything from the list
            List<String> messages = new ArrayList<>();
            String msg;
            while ((msg = redis.opsForList().leftPop(key)) != null) {
                messages.add(msg);
            }

            if (messages.isEmpty()) {
                continue;
            }

            // build the summary
            String firstBot = extractBotName(messages.get(0));
            int othersCount = messages.size() - 1;

            if (othersCount > 0) {
                log.info("Summarized Push Notification for User {}: {} and {} others interacted with your posts.",
                        userId, firstBot, othersCount);
            } else {
                log.info("Summarized Push Notification for User {}: {} interacted with your posts.",
                        userId, firstBot);
            }
        }
    }

    private String extractBotName(String message) {
        // messages look like "BotName replied to your post #123"
        int idx = message.indexOf(" replied");
        if (idx > 0) {
            return message.substring(0, idx);
        }
        return message; // fallback
    }
}
