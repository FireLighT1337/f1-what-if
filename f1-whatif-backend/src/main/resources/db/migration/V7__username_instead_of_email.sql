-- Accounts now sign in with a username instead of an email address.
-- Existing values are kept as they are, so current accounts keep working: their old email address is now their username.
-- One statement per change, which also works on TiDB.
ALTER TABLE app_user CHANGE COLUMN email username VARCHAR(254) NOT NULL;
ALTER TABLE app_user RENAME INDEX uq_app_user_email TO uq_app_user_username;
