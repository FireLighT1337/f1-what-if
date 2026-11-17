CREATE TABLE app_user (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    email         VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_app_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scenario (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    owner_id        BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    season_year     INT NOT NULL,
    ruleset_code    VARCHAR(64) NOT NULL,
    include_sprints BOOLEAN NOT NULL,
    count_best      INT,
    public_id       VARCHAR(36),
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_scenario_public_id (public_id),
    KEY idx_scenario_owner (owner_id),
    CONSTRAINT fk_scenario_owner FOREIGN KEY (owner_id) REFERENCES app_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scenario_excluded_driver (
    scenario_id BIGINT NOT NULL,
    driver_id   BIGINT NOT NULL,
    PRIMARY KEY (scenario_id, driver_id),
    CONSTRAINT fk_excluded_driver_scenario FOREIGN KEY (scenario_id) REFERENCES scenario (id) ON DELETE CASCADE,
    CONSTRAINT fk_excluded_driver_driver FOREIGN KEY (driver_id) REFERENCES driver (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Races are stored by round number, not by id, because the importer recreates races.
CREATE TABLE scenario_excluded_round (
    scenario_id  BIGINT NOT NULL,
    round_number INT NOT NULL,
    PRIMARY KEY (scenario_id, round_number),
    CONSTRAINT fk_excluded_round_scenario FOREIGN KEY (scenario_id) REFERENCES scenario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
