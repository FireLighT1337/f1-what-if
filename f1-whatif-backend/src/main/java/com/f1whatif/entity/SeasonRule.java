package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Which round totals counted towards a season's real championship. Maintained by hand with Flyway
 * migrations; a season without a row counted every result.
 */
@Entity
@Table(name = "season_rule")
public class SeasonRule {

    @Id
    @Column(name = "season_year")
    private int seasonYear;

    @Column(name = "split_after_round")
    private Integer splitAfterRound;

    @Column(name = "best_first")
    private Integer bestFirst;

    @Column(name = "best_second")
    private Integer bestSecond;

    @Column(name = "best_overall")
    private Integer bestOverall;

    protected SeasonRule() {
    }

    public SeasonRule(int seasonYear, Integer splitAfterRound, Integer bestFirst, Integer bestSecond,
                      Integer bestOverall) {
        this.seasonYear = seasonYear;
        this.splitAfterRound = splitAfterRound;
        this.bestFirst = bestFirst;
        this.bestSecond = bestSecond;
        this.bestOverall = bestOverall;
    }

    public int getSeasonYear() {
        return seasonYear;
    }

    public Integer getSplitAfterRound() {
        return splitAfterRound;
    }

    public Integer getBestFirst() {
        return bestFirst;
    }

    public Integer getBestSecond() {
        return bestSecond;
    }

    public Integer getBestOverall() {
        return bestOverall;
    }
}
