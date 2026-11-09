-- Someone who Joined through a Tool's link rather than being added (ADR-0005): where
-- they came from, as the Tool said it ("Mom's move on MoveLink"). NULL for everyone a
-- Hub Admin or an Organizer added. added_by is still whose link it was.
ALTER TABLE people ADD COLUMN joined_via TEXT;
