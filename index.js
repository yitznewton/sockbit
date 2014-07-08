var socket = io();
var projectId = 1;
var noteTextarea = document.querySelector('div[data-note-id="1"] textarea');

var noteContainer = document.getElementById('notes');
var textareas = {};

var addNote = function(note) {
    var textarea = document.createElement('TEXTAREA');
    textarea.dataset.noteId = note.id;
    textarea.value = note.text;
    noteContainer.appendChild(textarea);
    textareas[note.id] = textarea;

    textarea.addEventListener('blur', (function(note) {
        return function() {
            console.log('sending update to server for note ' + note.id + ': ' + this.value);
            socket.emit('update_note', {
                note_id: note.id,
                project_id: projectId,
                text: this.value
            });
        };
    })(note));
}

var initializeNotes = function(msg) {
    console.log('loading notes from server');
    socket.removeListener('project_notes', initializeNotes);

    var notes = msg.notes;
    for (var i in notes) {
        var note = notes[i];
        addNote(notes[i]);
    }
};

socket.on('note_updated', function(msg) {
    console.log('updating note from server', msg);
    textareas[msg.id].value = msg.text;
});

socket.on('project_notes', initializeNotes);
socket.emit('get_notes', {project_id: projectId});
