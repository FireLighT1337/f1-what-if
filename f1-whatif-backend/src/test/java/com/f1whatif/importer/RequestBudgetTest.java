package com.f1whatif.importer;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class RequestBudgetTest {

    @Test
    void requestsAreAllowedWhileBudgetRemains() {
        RequestBudget budget = new RequestBudget(3);
        budget.record(0);
        budget.record(1_000);

        assertEquals(0L, budget.millisToWait(2_000));
    }

    @Test
    void waitsUntilTheOldestRequestIsAnHourOld() {
        RequestBudget budget = new RequestBudget(2);
        budget.record(0);
        budget.record(1_000);

        assertEquals(3_598_000L, budget.millisToWait(2_000));
    }

    @Test
    void budgetFreesUpAfterAnHour() {
        RequestBudget budget = new RequestBudget(2);
        budget.record(0);
        budget.record(1_000);

        assertEquals(0L, budget.millisToWait(3_600_000));
    }
}
