-- How each points system treats races that ended early.
-- HALF_1980: no points under 2 laps, half points up to 75% distance (rule used until 2021).
-- TIERED_2022: reduced points tables below 25%, 50% and 75% distance (rule from 2022).
ALTER TABLE scoring_ruleset
    ADD COLUMN shortened_policy VARCHAR(20) NOT NULL DEFAULT 'NONE';

UPDATE scoring_ruleset SET shortened_policy = 'TIERED_2022' WHERE code = 'current-2025';
UPDATE scoring_ruleset SET shortened_policy = 'HALF_1980'
 WHERE code IN ('fl-2019-2024', 'sprint-2021', 'modern-2010', 'classic-2003', 'classic-1991', 'classic-1961');

-- Races that ended before the scheduled distance and paid reduced points.
-- completed_laps counts laps behind the safety car; racing_laps does not.
-- racing_laps equals completed_laps for the five races where no safety-car-only
-- running decided the result; the 2021 Belgian GP had no racing laps at all.
CREATE TABLE shortened_race (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    season_year    INT NOT NULL,
    round_number   INT NOT NULL,
    scheduled_laps INT NOT NULL,
    completed_laps INT NOT NULL,
    racing_laps    INT NOT NULL,
    note           VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uq_shortened_race (season_year, round_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO shortened_race (season_year, round_number, scheduled_laps, completed_laps, racing_laps, note) VALUES
 (1975,  4, 75, 29, 29, 'Spanish GP: stopped after a crash, 29 of 75 laps, half points'),
 (1975, 12, 54, 29, 29, 'Austrian GP: stopped by rain, 29 of 54 laps, half points'),
 (1984,  6, 77, 31, 31, 'Monaco GP: stopped by rain, 31 of 77 laps, half points'),
 (1991, 16, 81, 14, 14, 'Australian GP: stopped by rain, 14 of 81 laps, half points'),
 (2009,  2, 56, 31, 31, 'Malaysian GP: stopped by rain, 31 of 56 laps, half points'),
 (2021, 12, 44,  2,  0, 'Belgian GP: two laps behind the safety car, no racing laps, half points');
