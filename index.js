var socket = io();
var noteTextarea = document.querySelector('div[data-note-id="1"] textarea');

socket.on('note_updated', function(msg) {
    console.log('message received', msg);
    noteTextarea.value = msg.text;
});

noteTextarea.addEventListener('blur', function() {
    console.log('updating note: ' + this.value);
    socket.emit('update_note', {
        note_id: 1,
        project_id: 1,
        text: this.value
    });
});
