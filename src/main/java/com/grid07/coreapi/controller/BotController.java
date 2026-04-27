package com.grid07.coreapi.controller;

import com.grid07.coreapi.model.Bot;
import com.grid07.coreapi.repository.BotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bots")
public class BotController {

    private final BotRepository botRepo;

    public BotController(BotRepository botRepo) {
        this.botRepo = botRepo;
    }

    @PostMapping
    public ResponseEntity<Bot> createBot(@RequestBody Bot bot) {
        Bot saved = botRepo.save(bot);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Bot>> getAllBots() {
        return ResponseEntity.ok(botRepo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bot> getBot(@PathVariable Long id) {
        return botRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
