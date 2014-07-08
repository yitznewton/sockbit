CREATE TABLE note (
    id INTEGER PRIMARY KEY,
    text TEXT,
    project_id INTEGER
);

INSERT INTO note VALUES (
    null,
    'Hi there, here''s a note!',
    1
);
