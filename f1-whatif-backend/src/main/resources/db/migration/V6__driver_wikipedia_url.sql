-- Link to the driver's Wikipedia article, taken from the Jolpica data.
-- It is filled by the importer (run it again after this migration) and used to look up a photo.
ALTER TABLE driver ADD COLUMN wikipedia_url VARCHAR(255) NULL;
