# Core API & Guardrails — Grid07 Intern Assignment

A Spring Boot microservice that serves as the central API gateway with Redis-backed guardrails to manage bot interactions, virality tracking, and smart notification batching.

## Tech Stack

- **Java 17** / **Spring Boot 3.2.5**
- **PostgreSQL 15** — persistent storage (source of truth)
- **Redis 7** — real-time counters, locks, and notification queues
- **Docker Compose** — local infra setup

## Quick Start

### 1. Start Postgres and Redis

```bash
docker-compose up -d
```

This spins up:
- PostgreSQL on `localhost:5432` (db: `coreapi`, user: `admin`, pass: `secret`)
- Redis on `localhost:6379`

### 2. Run the Application

```bash
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 3. Test with Postman

Import the included `postman_collection.json` into Postman. The collection has pre-configured requests for all endpoints.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a new post |
| POST | `/api/posts/{postId}/comments` | Add a comment to a post |
| POST | `/api/posts/{postId}/like` | Like a post |

---

## How Thread Safety is Guaranteed (Phase 2)

This is the part that matters most for the concurrency test (200 bots hitting the same post simultaneously).

### The Problem

A naive approach would be:
1. Read the bot count from Redis
2. Check if it's under 100
3. Increment it

But between steps 1 and 3, another thread could sneak in and do the same — leading to 101+ comments slipping through.

### The Solution: Lua Script

I used a **Redis Lua script** that runs atomically on the Redis server:

```lua
local count = redis.call('INCR', KEYS[1])
if count > 100 then
    redis.call('DECR', KEYS[1])
    return 0
end
return 1
```

**Why this works:**
- Redis executes Lua scripts in a **single-threaded, atomic** fashion. No other command can interleave while the script runs.
- The script increments the counter first, then checks. If we're over the cap, it immediately decrements and returns `0` (rejected).
- This means even if 200 requests arrive at the exact same millisecond, each one gets serialized through this script. The counter never exceeds 100.

### Other Guardrails

- **Vertical Cap (depth ≤ 20):** Simple check on the `depth_level` field. No Redis needed since depth is derived from the parent comment chain.
- **Cooldown Cap (10 min per bot-human pair):** Uses Redis `SETNX` with a TTL of 10 minutes. `setIfAbsent()` is atomic — if the key already exists, it returns `false` and we block the interaction.

### Compensation on Failure

If the Lua script allows a bot comment but the subsequent database write fails, the service catches the exception and decrements the Redis counter back — so we don't "waste" a slot.

---

## Architecture Notes

- **Stateless application:** All counters, cooldowns, and notification queues are stored in Redis. The Spring Boot app holds zero state in memory.
- **Redis = Gatekeeper, Postgres = Source of Truth:** Redis checks happen *before* any database write. If Redis says no, the database transaction never starts.
- **Notification Batching:** Bot interactions don't immediately notify users. They queue up in Redis lists and get swept every 5 minutes by a scheduled task, producing a summary notification.

---

## What I Added Beyond the Assignment Requirements

The assignment asked for specific entities, endpoints, and Redis guardrails. I added a few extras that I felt were necessary for a properly working system:

- **`PostLike` entity / table:** The assignment lists User, Bot, Post, and Comment in the schema but doesn't explicitly mention a table for likes. However, the `/like` endpoint needs to persist likes somewhere to prevent duplicate likes from the same user, so I added this.
- **`author_type` column on Post and Comment:** The assignment says `author_id` can be a User or a Bot, but doesn't specify how to differentiate between them. I added an `AuthorType` enum (USER/BOT) to make this explicit.
- **`parent_comment_id` column on Comment:** Needed to derive `depth_level` for nested replies. Without tracking the parent, there's no way to calculate how deep a thread goes.
- **`UserController` and `BotController`:** Simple CRUD endpoints for creating and listing Users and Bots. These aren't in the requirements but are needed to set up test data conveniently through the API.
- **`GET /api/posts/{postId}/virality`:** A read-only endpoint to check a post's virality score. Useful for debugging and verification during testing.
- **Input validation (`@Valid`, `@NotNull`, `@NotBlank`):** The assignment doesn't mention input validation, but I added it so the API returns clean 400 errors instead of letting invalid data hit the database.
- **Cross-post parent comment check:** Added validation that a `parentCommentId` actually belongs to the same post being commented on, to prevent broken thread chains.

---

## Project Structure

```
src/main/java/com/grid07/coreapi/
├── CoreApiApplication.java          # Entry point + @EnableScheduling
├── config/
│   └── RedisConfig.java             # Redis template bean
├── controller/
│   ├── PostController.java          # Main API endpoints
│   ├── UserController.java          # User CRUD (extra)
│   └── BotController.java          # Bot CRUD (extra)
├── dto/
│   ├── PostRequest.java
│   ├── CommentRequest.java
│   └── LikeRequest.java
├── exception/
│   ├── RateLimitException.java      # → 429
│   ├── ResourceNotFoundException.java # → 404
│   └── GlobalExceptionHandler.java
├── model/
│   ├── AuthorType.java              # USER | BOT enum
│   ├── User.java
│   ├── Bot.java
│   ├── Post.java
│   ├── Comment.java
│   └── PostLike.java
├── repository/                      # Standard JPA repos
├── scheduler/
│   └── NotificationSweeper.java     # 5-min CRON job
└── service/
    ├── PostService.java             # Business logic orchestration
    ├── GuardrailService.java        # Redis atomic locks (Lua script)
    ├── ViralityService.java         # Real-time virality scoring
    └── NotificationService.java     # Throttled notifications
```
