CREATE TABLE season (
    season_year INT NOT NULL,
    PRIMARY KEY (season_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE circuit (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    external_id VARCHAR(64)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    locality    VARCHAR(100),
    country     VARCHAR(100),
    PRIMARY KEY (id),
    UNIQUE KEY uq_circuit_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE race (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    season_year  INT NOT NULL,
    round_number INT NOT NULL,
    circuit_id   BIGINT NOT NULL,
    name         VARCHAR(150) NOT NULL,
    race_date    DATE,
    has_sprint   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_race_season_round (season_year, round_number),
    CONSTRAINT fk_race_season FOREIGN KEY (season_year) REFERENCES season (season_year),
    CONSTRAINT fk_race_circuit FOREIGN KEY (circuit_id) REFERENCES circuit (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE driver (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    external_id   VARCHAR(64)  NOT NULL,
    given_name    VARCHAR(100) NOT NULL,
    family_name   VARCHAR(100) NOT NULL,
    code          VARCHAR(8),
    nationality   VARCHAR(100),
    date_of_birth DATE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_driver_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE team (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    external_id VARCHAR(64)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    nationality VARCHAR(100),
    PRIMARY KEY (id),
    UNIQUE KEY uq_team_external_id (external_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE race_result (
    id               BIGINT NOT NULL AUTO_INCREMENT,
    race_id          BIGINT NOT NULL,
    driver_id        BIGINT NOT NULL,
    team_id          BIGINT NOT NULL,
    session_type     VARCHAR(10) NOT NULL,
    grid_position    INT,
    finish_position  INT,
    position_text    VARCHAR(8),
    status_text      VARCHAR(64),
    fastest_lap_rank INT,
    actual_points    DECIMAL(5,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_result_session (race_id, driver_id, session_type),
    KEY idx_result_driver (driver_id),
    CONSTRAINT fk_result_race   FOREIGN KEY (race_id)   REFERENCES race (id),
    CONSTRAINT fk_result_driver FOREIGN KEY (driver_id) REFERENCES driver (id),
    CONSTRAINT fk_result_team   FOREIGN KEY (team_id)   REFERENCES team (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scoring_ruleset (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    code                        VARCHAR(64)  NOT NULL,
    name                        VARCHAR(150) NOT NULL,
    description                 VARCHAR(500),
    fastest_lap_point           DECIMAL(4,2) NOT NULL DEFAULT 0,
    fastest_lap_requires_top_ten BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ruleset_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ruleset_race_points (
    ruleset_id      BIGINT NOT NULL,
    finish_position INT NOT NULL,
    points          DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (ruleset_id, finish_position),
    CONSTRAINT fk_race_points_ruleset FOREIGN KEY (ruleset_id) REFERENCES scoring_ruleset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ruleset_sprint_points (
    ruleset_id      BIGINT NOT NULL,
    finish_position INT NOT NULL,
    points          DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (ruleset_id, finish_position),
    CONSTRAINT fk_sprint_points_ruleset FOREIGN KEY (ruleset_id) REFERENCES scoring_ruleset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
