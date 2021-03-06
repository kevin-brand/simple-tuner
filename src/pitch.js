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

let startDelayInMS = 3000;
let isLoading = true;

//get DPI
let dpi = window.devicePixelRatio;

// display variables
let arcMarginTop = 20;
let textMarginTop = 50 + arcMarginTop;
let primaryColor = "#7380ec";
let strokeColor = "#363949";

// Perform setup once DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    setup();
    fixDPI();
});


// Hook up method to start button
startButton.addEventListener("click", () => {
    startTuner();
});

// Clamp function
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

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
    // Give tuner enough time to init
    setTimeout(function(){
        setLoadingDone();
    }, startDelayInMS);

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

// Kicks of animation loop
function draw() {
    requestAnimationFrame(draw);
    drawTuner();
}

function drawTuner() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStaticElements();
    drawDynamicElements();
}

function drawStaticElements() {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 + arcMarginTop, (canvas.width / 4), Math.PI, 0, false);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();
}

function drawDynamicElements() {
    // Settings
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px Roboto";

    // Draw
    if (isLoading) {
        ctx.fillText("LOADING", canvas.width / 2, canvas.height / 2 + textMarginTop);
    } else {
        let strokeStyle = (Math.abs(offset) < 0.3) ? primaryColor : strokeColor;
        let fillStyle = (Math.abs(offset) < 0.3) ? primaryColor : "white";

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        drawPointer(offset);
        
        ctx.lineWidth = 1;
        ctx.fillText(offset.toString(), canvas.width / 2, canvas.height / 2 + textMarginTop);
        ctx.strokeText(offset.toString(), canvas.width / 2, canvas.height / 2 + textMarginTop);
    }
}

// Draws the pointer by using the current offset as an angle
function drawPointer(currentOffset) {
    currentOffset = clamp(currentOffset, -30, 30);
    ctx.save();
    ctx.beginPath();
    ctx.translate(canvas.width / 2, canvas.height / 2 + arcMarginTop);
    ctx.rotate(-180 * Math.PI / 180);
    ctx.rotate((currentOffset * 3) * Math.PI / 180);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, (canvas.width / 4) - 20);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

// fixes the DPI issues of a canvas that is rescaled via CSS
function fixDPI() {
    //get CSS height & width
    //the slice method gets rid of "px"
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

    //scale the canvas
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}

// gets called when loading is finished
function setLoadingDone() {
    isLoading = false;
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


