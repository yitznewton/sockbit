<?php

namespace EasyBib\SockBit\Repository;

interface NoteRepository
{
    /**
     * @param int $projectId
     * @return array
     */
    public function getAll($projectId);

    /**
     * @param int $noteId 
     * @param array $data 
     * @return array
     */
    public function update($noteId, array $data);
}
