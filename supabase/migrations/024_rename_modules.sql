-- Rename 3 modules for shorter, cleaner titles on mobile
-- Run manually in Supabase SQL editor

UPDATE modules SET title = 'Connectors' WHERE title = 'Connectors & Discourse Markers';
UPDATE modules SET title = 'Advanced Clauses' WHERE title = 'Complex Sentences';
UPDATE modules SET title = 'Conversational Spanish' WHERE title = 'Conversational & Pragmatic Markers';
