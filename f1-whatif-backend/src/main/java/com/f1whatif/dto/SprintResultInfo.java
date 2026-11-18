package com.f1whatif.dto;

import java.math.BigDecimal;

/** How a driver finished the sprint of a race weekend. */
public record SprintResultInfo(
        Integer grid,
        Integer finishPosition,
        String positionText,
        BigDecimal points) {
}
