package com.f1whatif.web;

import com.f1whatif.dto.RaceInfo;
import com.f1whatif.dto.RulesetDetail;
import com.f1whatif.dto.SeasonDriver;
import com.f1whatif.dto.SeasonSummary;
import com.f1whatif.service.ReferenceDataService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ReferenceController {

    private final ReferenceDataService referenceData;

    public ReferenceController(ReferenceDataService referenceData) {
        this.referenceData = referenceData;
    }

    @GetMapping("/seasons")
    public List<SeasonSummary> seasons() {
        return referenceData.seasons();
    }

    @GetMapping("/seasons/{year}/races")
    public List<RaceInfo> races(@PathVariable int year) {
        return referenceData.races(year);
    }

    @GetMapping("/seasons/{year}/drivers")
    public List<SeasonDriver> drivers(@PathVariable int year) {
        return referenceData.drivers(year);
    }

    @GetMapping("/rulesets/{code}")
    public RulesetDetail ruleset(@PathVariable String code) {
        return referenceData.ruleset(code);
    }
}
