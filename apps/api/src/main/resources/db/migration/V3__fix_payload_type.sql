ALTER TABLE notifications ALTER COLUMN payload TYPE TEXT USING payload::text;
