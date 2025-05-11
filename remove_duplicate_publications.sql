-- Find duplicate publications based on title content
CREATE TEMPORARY TABLE duplicate_publications AS
SELECT p1.id, p1.title_id, ls1.en as title_en, ls1.ru as title_ru
FROM publications p1
JOIN localized_strings ls1 ON p1.title_id = ls1.id
JOIN publications p2 ON p1.id > p2.id
JOIN localized_strings ls2 ON p2.title_id = ls2.id
WHERE LOWER(ls1.en) = LOWER(ls2.en) OR LOWER(ls1.ru) = LOWER(ls2.ru);

-- Show duplicates (for reference)
SELECT d.id, d.title_en, d.title_ru
FROM duplicate_publications d;

-- Begin transaction
BEGIN TRANSACTION;

-- Delete publication authors for duplicates
DELETE FROM publication_authors
WHERE publication_id IN (SELECT id FROM duplicate_publications);

-- Delete external authors for duplicates
DELETE FROM publication_external_authors
WHERE publication_id IN (SELECT id FROM duplicate_publications);

-- Delete duplicate publications
DELETE FROM publications
WHERE id IN (SELECT id FROM duplicate_publications);

-- Commit changes
COMMIT;

-- Create a trigger to prevent inserting duplicates based on title content
DROP TRIGGER IF EXISTS prevent_duplicate_publication_titles;
CREATE TRIGGER prevent_duplicate_publication_titles
BEFORE INSERT ON publications
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Publication with this title already exists')
    WHERE EXISTS (
        SELECT 1 
        FROM publications p
        JOIN localized_strings ls1 ON p.title_id = ls1.id
        JOIN localized_strings ls2 ON ls2.id = NEW.title_id
        WHERE LOWER(ls1.en) = LOWER(ls2.en) OR LOWER(ls1.ru) = LOWER(ls2.ru)
    );
END;

-- Create a trigger to prevent updating to duplicate titles
DROP TRIGGER IF EXISTS prevent_duplicate_publication_titles_update;
CREATE TRIGGER prevent_duplicate_publication_titles_update
BEFORE UPDATE ON localized_strings
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM publications WHERE title_id = NEW.id)
BEGIN
    SELECT RAISE(ABORT, 'Update would create duplicate publication title')
    WHERE EXISTS (
        SELECT 1 
        FROM publications p
        JOIN localized_strings ls ON p.title_id = ls.id
        WHERE p.title_id != NEW.id
        AND (LOWER(ls.en) = LOWER(NEW.en) OR LOWER(ls.ru) = LOWER(NEW.ru))
    );
END;

-- Drop temporary table
DROP TABLE duplicate_publications; 