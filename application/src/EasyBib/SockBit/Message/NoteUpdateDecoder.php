<?php

namespace EasyBib\SockBit\Message;

class NoteUpdateDecoder
{
    /**
     * @param string $rawMessage 
     * @return array
     */
    public function decode($rawMessage)
    {
        $decoded = json_decode($rawMessage, true);

        if (!is_array($decoded)) {
            return null;
        }

        $expectedKeys = [
            'project_id',
            'note_id',
            'text',
        ];

        $expectedArray = array_combine($expectedKeys, $expectedKeys);

        if (array_diff_key($expectedArray, $decoded)) {
            return null;
        }

        return $decoded;
    }
}
