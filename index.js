var socket = io();
var noteTextarea = document.querySelector('div[data-note-id="1"] textarea');

socket.on('note_updated', function(msg) {
    console.log('message received', msg);
    textareas[msg.id].value = msg.text;
});

var noteContainer = document.getElementById('notes');
var textareas = {};

var notes = [
    {
        id: 1,
        text: "jim the slim"
    },
    {
        id: 2,
        text: "nate the late"
    }
];

for (var i in notes) {
    var note = notes[i];
    var textarea = document.createElement('TEXTAREA');
    textarea.dataset.noteId = note.id;
    textarea.value = note.text;
    noteContainer.appendChild(textarea);
    textareas[note.id] = textarea;

    textarea.addEventListener('blur', (function(note) {
        return function() {
            console.log('updating note ' + note.id + ': ' + this.value);
            socket.emit('update_note', {
                note_id: note.id,
                project_id: 1,
                text: this.value
            });
        };
    })(note));
}

