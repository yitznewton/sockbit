var socket = io();
var projectId = 1;
var noteTextarea = document.querySelector('div[data-note-id="1"] textarea');

socket.on('note_updated', function(msg) {
    console.log('message received', msg);
    textareas[msg.id].value = msg.text;
});

socket.emit('get_notes', {project_id: projectId});

socket.on('project_notes', function(msg) {
    socket.removeAllListeners('project_notes');
    initializeNotes(msg.notes);
});

var noteContainer = document.getElementById('notes');
var textareas = {};

var initializeNotes = function(notes) {
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
                    project_id: projectId,
                    text: this.value
                });
            };
        })(note));
    }
};

