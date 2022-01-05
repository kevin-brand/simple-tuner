// Grab canvas and context
let canvas = document.querySelector("#tuner-canvas"); 
let ctx = canvas.getContext("2d");

// Grab needec DOM elements
let startButton = document.querySelector("#tuner-start-button");
let targetNoteSelection = document.querySelector("#target-note-selection");
let targetOctaveSelection = document.querySelector("#target-octave-selection");


// Variables
let pitch;
let audioContext;
let micro;
let pianoMidiKeys;

let currentNoteName = '';
let currentNoteFrequency = 0;


let targetNoteName = '';
let targetNoteFrequency = 0;

let distance = 0;
let offset = 0;


// Perform setup once DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    setup();
});


// Hook up method to start button
startButton.addEventListener("click", () => {
    startTuner();
});


// Performs setup by grabbing all things required by ml5.js
async function setup() {
    /**set up audio stream */
    stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    audioContext = new AudioContext();
    
    /**fetch midi to key json */
    let response = await fetch('../assets/piano_midi_keys.json');
    pianoMidiKeys = await response.json();
    pianoMidiKeys = pianoMidiKeys.reverse();

    /**grab the canvas again to avoid resizing issues*/
    canvas = document.querySelector('#tuner-canvas');
    ctx = canvas.getContext('2d');    
}


// Start the tuning process
function startTuner() {

    // Find target Note Frequency
    pianoMidiKeys.forEach(pianoMidiKey => {
        let tempName = pianoMidiKey.noteName;
        tempName = tempName.toLowerCase();

        let tempTargetNote = targetNoteSelection.value;
        let tempTargetOctave = targetOctaveSelection.value;

        let tempTarget = tempTargetNote + tempTargetOctave;
        tempTarget = tempTarget.toLowerCase();

        if (tempName.includes(tempTarget)) {
            targetNoteName = pianoMidiKey.noteName;
            targetNoteFrequency = pianoMidiKey.frequency;
        }
    });

    initPitchDetection(stream, audioContext);

    requestAnimationFrame(draw);
}

// Initialises the ml5.js pitch detection
function initPitchDetection(stream, audioContext) {
    pitch = ml5.pitchDetection(
        '../assets/model/',
        audioContext,
        stream,
        onModelLoaded
    );
}

// Call back when ml5 model is loaded
function onModelLoaded() {
    listenForPitch();
}

// This does the tuning
function listenForPitch() {
    pitch.getPitch(function(err, frequency) {
        if (frequency) {
            // Convert frequency to midi
            let m = frequencyToMidi(frequency);
            currentNoteFrequency = frequency;
            currentNoteName = midiToNoteName(m);    
            distance = Math.round(calculateCents(currentNoteFrequency, targetNoteFrequency));

            // Calculate offset between input note and target note
            let distanceAbs = Math.abs(distance);
            let n = (distanceAbs % 100 < 50) ? 0 : 1;
            offset = ((distanceAbs / 100) + n) * Math.sign(distance);
            offset = offset.toFixed(1);

            // OLD: Alternative to Midi Lookup Table. Pure maths. 
            //let octave = Math.floor(5 + ((offset - 3) / 12));
            //let octaveOffset = Math.round(((offset -3) % 12 + 12) % 12);
            //console.log("Offset " + offset + ", Octave: " + octave + ", Octave Offset: " + octaveOffset);
        }

        if(err) {
            console.log(err);
        }

        // Recursive call
        listenForPitch();
    });
}

function draw() {
    requestAnimationFrame(draw);
    drawTuner();
}

// Draws information on the Tuner canvas
function drawTuner() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px Roboto";
  
    // Gives feedback to the user that the tone is close enough. Could be tweeked
    if (Math.abs(offset) < 0.3)
        ctx.fillStyle = "chartreuse";
    else 
        ctx.fillStyle = "white";

    ctx.fillText(offset.toString(), canvas.width / 2, canvas.height / 2);

    ctx.strokeStyle = "#494949";
    ctx.linewidth = 5;
    ctx.strokeText(offset.toString(), canvas.width / 2, canvas.height / 2);
}

// Calculates cents between current midi note and target note
function calculateCents(current, target) {
    return 1200 * Math.log2(current / target)
}

// Converts frequency to midi note
function frequencyToMidi(freq) {
    return 69 + 12 * Math.log2(freq/440);
}

// Converts a midi note to a note name via simple lookup table
function midiToNoteName(midi) {
    pianoMidiKeys.forEach(pianoMidiKey => {
        if (pianoMidiKey.midiNoteNumber === midi) {
            return pianoMidiKey.noteName;
        }
    });
}


