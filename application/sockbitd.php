<?php

require_once __DIR__.'/vendor/autoload.php';

use EasyBib\SockBit\Message\NoteAnnouncer;
use EasyBib\SockBit\Repository\SqlNoteRepository;
use PhpAmqpLib\Connection\AMQPConnection;
use PhpAmqpLib\Message\AMQPMessage;

$rabbitConnection = new AMQPConnection('localhost', 5672, 'guest', 'guest');
$noteRepo = new SqlNoteRepository();

$announcer = new NoteAnnouncer($rabbitConnection);

$jobs = [
    'update_note' => function($data) use ($noteRepo, $announcer) {
        $result = $noteRepo->update($data['note_id'], $data);
        $announcer->announce('note_updated', $result);
    },
    'get_notes' => function($data) use ($noteRepo, $announcer) {
        $projectId = $data['project_id'];
        $announcer->announce('project_notes', [
            'project_id' => $projectId,
            'notes' => $noteRepo->getAll($projectId),
        ]);
    },
];

$job = function ($message) use ($noteRepo, $jobs) {
    $messageText = $message->body;
    echo 'Processing message: ' . $messageText . "\n";
    $decodedMessage = json_decode($messageText, true);

    if ($decodedMessage) {
        $jobName = $decodedMessage[0];

        if (!isset($jobs[$jobName])) {
            echo "Invalid message\n";
        } else {
            $toExecute = $jobs[$jobName];
            $toExecute($decodedMessage[1]);
        }
    } else {
        echo "Invalid message\n";
    }

    $message->delivery_info['channel']->basic_ack($message->delivery_info['delivery_tag']);
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
