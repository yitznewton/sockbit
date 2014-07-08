<?php

require_once __DIR__.'/vendor/autoload.php';

use EasyBib\SockBit\Message\NoteUpdateAnnouncer;
use EasyBib\SockBit\Message\NoteUpdateDecoder;
use EasyBib\SockBit\Repository\SqlNoteRepository;
use PhpAmqpLib\Connection\AMQPConnection;
use PhpAmqpLib\Message\AMQPMessage;

$rabbitConnection = new AMQPConnection('localhost', 5672, 'guest', 'guest');
$decoder = new NoteUpdateDecoder();
$noteRepo = new SqlNoteRepository();

$announcer = new NoteUpdateAnnouncer($rabbitConnection);

$job = function ($message) use ($decoder, $noteRepo, $announcer) {
    $messageText = $message->body;
    echo 'Processing message: ' . $messageText . "\n";
    $decodedNote = $decoder->decode($messageText);
    
    if ($decodedNote) {
        $noteRepo->update($decodedNote['note_id'], $decodedNote);
    } else {
        echo "Invalid message\n";
    }

    $message->delivery_info['channel']->basic_ack($message->delivery_info['delivery_tag']);
    $announcer->announce($decodedNote);
};

$jobsChannel = $rabbitConnection->channel();

$jobsChannel->queue_declare('sockbit_work', false, true, false, false);
$jobsChannel->basic_qos(null, 1, null);
$jobsChannel->basic_consume('sockbit_work', '', false, false, false, false, $job);

echo "listening for jobs on rabbit\n";

while (count($jobsChannel->callbacks)) {
    $jobsChannel->wait();
}

$jobsChannel->close();
$rabbitConnection->close();
