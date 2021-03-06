<?php

namespace EasyBib\SockBit\Message;

use PhpAmqpLib\Message\AMQPMessage;

class NoteAnnouncer
{
    const CHANNEL_NAME = 'sockbit_announce';

    private $channel;

    public function __construct($connection)
    {
        $this->channel = $connection->channel();
        $this->channel->exchange_declare(self::CHANNEL_NAME, 'fanout', false, false, false);
    }

    public function __destruct()
    {
        $this->channel->close();
    }

    public function announce($announcementType, array $data)
    {
        $json = json_encode([$announcementType, $data]);
        printf("Broadcasting to rabbit %s: %s\n", self::CHANNEL_NAME, $json);
        $message = new AMQPMessage($json);
        $this->channel->basic_publish($message, self::CHANNEL_NAME);
    }
}
