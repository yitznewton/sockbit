CREATE TABLE note (
    id INTEGER PRIMARY KEY,
    text TEXT,
    project_id INTEGER
);

INSERT INTO note VALUES (
    null,
    'Hi there, here''s one note!',
    1
);

INSERT INTO note VALUES (
    null,
    'Oy, here''s another note!',
    1
);
