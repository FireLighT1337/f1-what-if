-- Which round totals counted towards the real championship, per season (1961-1990).
-- Seasons without a row count every result.
--   best_overall:      only the best N round totals count (split_after_round is NULL)
--   split_after_round: rounds 1..split_after_round are the first part of the season, the rest the second;
--                      best_first / best_second round totals count in each part
CREATE TABLE season_rule (
    season_year       INT NOT NULL,
    split_after_round INT NULL,
    best_first        INT NULL,
    best_second       INT NULL,
    best_overall      INT NULL,
    PRIMARY KEY (season_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO season_rule (season_year, split_after_round, best_first, best_second, best_overall) VALUES
 (1961, NULL, NULL, NULL, 5),
 (1962, NULL, NULL, NULL, 5),
 (1963, NULL, NULL, NULL, 6),
 (1964, NULL, NULL, NULL, 6),
 (1965, NULL, NULL, NULL, 6),
 (1966, NULL, NULL, NULL, 5),
 (1967, 6, 5, 4, NULL),
 (1968, 6, 5, 5, NULL),
 (1969, 6, 5, 4, NULL),
 (1970, 7, 6, 5, NULL),
 (1971, 6, 5, 4, NULL),
 (1972, 6, 5, 5, NULL),
 (1973, 8, 7, 6, NULL),
 (1974, 8, 7, 6, NULL),
 (1975, 7, 6, 6, NULL),
 (1976, 8, 7, 7, NULL),
 (1977, 9, 8, 7, NULL),
 (1978, 8, 7, 7, NULL),
 (1979, 7, 4, 4, NULL),
 (1980, 7, 5, 5, NULL),
 (1981, NULL, NULL, NULL, 10),
 (1982, NULL, NULL, NULL, 11),
 (1983, NULL, NULL, NULL, 11),
 (1984, NULL, NULL, NULL, 11),
 (1985, NULL, NULL, NULL, 11),
 (1986, NULL, NULL, NULL, 11),
 (1987, NULL, NULL, NULL, 11),
 (1988, NULL, NULL, NULL, 11),
 (1989, NULL, NULL, NULL, 11),
 (1990, NULL, NULL, NULL, 11);

-- Races whose race points were multiplied, whatever points system is used.
CREATE TABLE race_multiplier (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    season_year  INT NOT NULL,
    round_number INT NOT NULL,
    multiplier   DECIMAL(4,2) NOT NULL,
    note         VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uq_race_multiplier (season_year, round_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO race_multiplier (season_year, round_number, multiplier, note) VALUES
 (2014, 19, 2.00, 'Abu Dhabi GP: double points');
