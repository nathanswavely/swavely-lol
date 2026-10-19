-- Who has been removed, so every Tool can remove them too (ADR-0003). Only the opaque id
-- and when: the name, email, managers and sessions go with the Person's row. Kept for
-- good; a Tool asks for what is new since it last looked.
CREATE TABLE IF NOT EXISTS removed_people (
  id          TEXT PRIMARY KEY,              -- the Person's id, as every Tool stored it
  removed_at  INTEGER NOT NULL               -- unix seconds
);
CREATE INDEX IF NOT EXISTS removed_people_at ON removed_people (removed_at);
