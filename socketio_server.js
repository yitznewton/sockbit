var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var amqp = require('amqplib');
var when = require('when');

app.get('/', function(req, rsp) {
    rsp.sendfile('index.html');
});

app.get('/index.js', function(req, rsp) {
    rsp.sendfile('index.js');
});

var jobsQueueName = 'sockbit_work',
    announceQueueName = 'sockbit_announce',
    jobsChannel;

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
    console.log('registering forward of ' + jobName + ' job requests to rabbit');

    socket.on(jobName, function(message) {
        var jobString = JSON.stringify([jobName, message]);
        console.log('forwarding job to rabbit: ' + jobString);
        console.log('sending job to rabbit');
        jobsChannel.sendToQueue(jobsQueueName, new Buffer(jobString), {deliveryMode:true});
    });
};

amqp.connect('amqp://localhost').then(function(conn) {
    when(conn.createChannel()).then(function(ch) {
        jobsChannel = ch;
        return ch.assertQueue(jobsQueueName, {durable: true});
    }).then(function() {
        return conn.createChannel();
    }).then(function(announceChannel) {
        announceChannel.assertExchange(announceQueueName, 'fanout', {durable: false});
        return announceChannel;
    }).then(function(announceChannel) {
        var queueOk = announceChannel.assertQueue('', {exclusive: true});
        return [announceChannel, queueOk];
    }).then(function(objs) {
        var announceChannel = objs[0];
        announceQueue = objs[1].queue;
        announceChannel.bindQueue(announceQueue, announceQueueName, '');
        return [announceChannel, announceQueue];
    }).then(function(objs) {
        var announceChannel = objs[0];
        var announceQueue = objs[1];

        announceChannel.consume(announceQueue, function(message) {
            var update = JSON.parse(message.content);
            var announcementName = update[0];
            var data = update[1];
            console.log('receiving announcement from rabbit: ' + message.content);
            console.log('sending update to browser clients');
            io.emit(announcementName, data);
        }, {noack: true});
    }).then(function() {
        console.log('listening for announcements from rabbit');

        io.on('connection', function(socket) {
            console.log('a user connected');

            forwardJob('update_note', socket);
            forwardJob('get_notes', socket);
        });
    });
});

var port = process.argv[2];

http.listen(port, function() {
    console.log('listening on port ' + port);
});
