-- A made-up family for local development (`npm run db:seed:local`). Never real people:
-- the repo is public (ADR-0001). Homer is the Hub Admin in .dev.vars.example. Bart and
-- Maggie have no email and are Managed by Homer and Marge. The gift exchange's own seed
-- refers to these ids.
DELETE FROM sessions; DELETE FROM login_codes; DELETE FROM managers; DELETE FROM people;
INSERT INTO people (id, name, email, added_by, added_at) VALUES
  ('p_homer',  'Homer Simpson',  'homer@example.com', NULL, 0),
  ('p_marge',  'Marge Simpson',  'marge@example.com', 'p_homer', 0),
  ('p_lisa',   'Lisa Simpson',   'lisa@example.com',  'p_homer', 0),
  ('p_bart',   'Bart Simpson',   NULL,                'p_homer', 0),
  ('p_maggie', 'Maggie Simpson', NULL,                'p_homer', 0),
  ('p_abe',    'Abe Simpson',    'abe@example.com',   'p_homer', 0),
  ('p_patty',  'Patty Bouvier',  'patty@example.com', 'p_homer', 0),
  ('p_selma',  'Selma Bouvier',  'selma@example.com', 'p_homer', 0);
INSERT INTO managers (person_id, manager_id) VALUES
  ('p_bart', 'p_homer'), ('p_bart', 'p_marge'),
  ('p_maggie', 'p_homer'), ('p_maggie', 'p_marge');
