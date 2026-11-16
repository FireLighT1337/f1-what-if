-- Local development setup. Run once as an admin user, for example:
--   mysql -u root -p < scripts/local-db-setup.sql
-- Flyway creates the tables on the app's first start.

CREATE DATABASE IF NOT EXISTS f1whatif CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'f1'@'localhost' IDENTIFIED BY 'f1';
GRANT ALL PRIVILEGES ON f1whatif.* TO 'f1'@'localhost';

-- Optional, for repository tests later:
-- CREATE DATABASE IF NOT EXISTS f1whatif_test CHARACTER SET utf8mb4;
-- GRANT ALL PRIVILEGES ON f1whatif_test.* TO 'f1'@'localhost';