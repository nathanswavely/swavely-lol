-- The People the Hub knows, who manages whom, and the sign-in (ADR-0001; the rules are
-- client-ops ADR-0009's). Codes and session ids are stored only as SHA-256 hashes.

-- A Person: a name, and usually an email. Without one they cannot sign in and are
-- Managed. Ids are opaque and are what every Tool stores.
CREATE TABLE IF NOT EXISTS people (
  id         TEXT PRIMARY KEY,               -- 'p_' + random
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,                    -- lower-cased; NULL for a Managed Person
  added_by   TEXT,                           -- a person id, or NULL for a Hub Admin's own row
  added_at   INTEGER NOT NULL                -- unix seconds
);

-- Who acts for a Managed Person. A manager is a Person with an email.
CREATE TABLE IF NOT EXISTS managers (
  person_id  TEXT NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  manager_id TEXT NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, manager_id)
);
CREATE INDEX IF NOT EXISTS managers_manager ON managers (manager_id);

-- One row per code issued; at most one live code per address.
CREATE TABLE IF NOT EXISTS login_codes (
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,                 -- sha256(email + ':' + code), hex
  attempts    INTEGER NOT NULL DEFAULT 0,    -- wrong guesses so far; five ends the code
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (email, code_hash)
);
CREATE INDEX IF NOT EXISTS login_codes_email_created ON login_codes (email, created_at);

-- One row per signed-in browser. Thirty days from creation, not sliding.
CREATE TABLE IF NOT EXISTS sessions (
  id_hash      TEXT PRIMARY KEY,             -- sha256(session id), hex
  person_id    TEXT NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS sessions_person ON sessions (person_id);
