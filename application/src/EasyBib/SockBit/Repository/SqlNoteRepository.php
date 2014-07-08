<?php

namespace EasyBib\SockBit\Repository;

use PDO;

class SqlNoteRepository implements NoteRepository
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = new PDO('sqlite:/vagrant/application/sockbit.sqlite3');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    /**
     * @param int $projectId
     * @return array
     */
    public function getAll($projectId)
    {
        $projectId = $this->sanitizeId($projectId);
        $q = 'SELECT id, text, project_id FROM note WHERE project_id = ?';
        $stmt = $this->pdo->prepare($q);
        $stmt->execute([$projectId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * @param int $noteId
     * @param array $data 
     * @return array
     */
    public function update($noteId, array $data)
    {
        $text = isset($data['text']) ? $data['text'] : '';
        $noteId = $this->sanitizeId($noteId);
        $q = 'UPDATE note SET text = ? WHERE id = ?';
        $stmt = $this->pdo->prepare($q);
        $stmt->execute([$text, $noteId]);

        $q = 'SELECT id, text, project_id FROM note WHERE id = ?';
        $stmt = $this->pdo->prepare($q);
        $stmt->execute([$noteId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function sanitizeId($rawId)
    {
        return (int) $rawId;
    }
}
