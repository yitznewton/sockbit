var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var amqp = require('amqplib');
var when = require('when');

app.get('/', function(req, rsp) {
    rsp.sendfile('index.html');
});

var jobsQueueName = 'sockbit_work',
    announceQueueName = 'note_updates',
    jobsChannel,
    announceQueue;

var prepRabbitAnnounceChannel = function(conn) {
    return conn.createChannel().then(function(channel) {
        channel.assertExchange(announceQueueName, 'fanout', {durable: false}).then(function() {
            return channel.assertQueue('', {exclusive: true});
        }).then(function(queueOk) {
            announceQueue = queueOk.queue;
            return channel.bindQueue(announceQueue, announceQueueName, '');
        });

        return channel;
    });
};

var forwardJob = function(jobName, socket) {
    console.log('forwarding ' + jobName + ' job requests to rabbit');

    socket.on(jobName, function(message) {
        var jobString = JSON.stringify([jobName, message]);
        console.log('forwarding job to rabbit: ' + jobString);
        console.log('sending job to rabbit');
        jobsChannel.sendToQueue(jobsQueueName, new Buffer(jobString), {deliveryMode:true});
    });
};

amqp.connect('amqp://localhost').then(function(conn) {
    return conn.createChannel().then(function(ch) {
        jobsChannel = ch;
        return ch.assertQueue(jobsQueueName, {durable: true});
    }).then(function() {
        console.log('ready to post to rabbit jobs channel');
        return prepRabbitAnnounceChannel(conn);
    }).then(function(announceChannel) {
        console.log('ready to listen for announcements from rabbit');

        io.on('connection', function(socket) {
            console.log('a user connected');

            announceChannel.consume(announceQueue, function(message) {
                var update = JSON.parse(message.content);
                console.log('receiving announcement from rabbit: ' + message.content);
                console.log('sending update to browser clients');
                io.emit('note_updated', update);
            }, {noack: true});

            console.log('listening for announcements from rabbit');

            forwardJob('update_note', socket);
        });
    });
});

var port = process.argv[2];

http.listen(port, function() {
    console.log('listening on port ' + port);
});
