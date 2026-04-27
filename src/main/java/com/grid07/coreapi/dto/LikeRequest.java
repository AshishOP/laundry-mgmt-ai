package com.grid07.coreapi.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LikeRequest {

    @NotNull(message = "userId is required")
    private Long userId;
}
