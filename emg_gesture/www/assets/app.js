'use strict';

let roshambo = null;
let options = {};
// Prepare DOM elements
const calibrate_button = document.getElementById('calibrate');
const start_button = document.getElementById('start');
let gauge_canvas = document.getElementById('gauge_canvas');
let _td_features = {};
const columns = ['A1', 'A2']; // columns of EMG activation bursts
columns.forEach(function (column) {
    _td_features[column] = document.getElementById(column);
});

// Define gauge options
const gaugeOptions = {
    lines: 1,
    angle: 0,
    lineWidth: 0.2,
    pointer: {
        legth: 0.9,
        strokeWidth: 0,
        color: '#ccc'
    },
    limitMax: 'false',
    percentColors:
        [[0.0, "#ffe74b"],
            [0.20, "#ffc04b"],
            [0.40, "#ff8a4b"],
            [0.60, "#ff5d4b"],
            [0.80, "#ff3030"]],
    strokeColor: '#E0E0E0',
    generateGradient: true
};

// Timeflux IO
// -----------
let io = new IO();

// subscribe to useful streams on new connection
io.on('connect', () => {
    console.log('connected');
    io.subscribe('events');
    io.subscribe('emg_burst');
});

// Load settings from UI timeflux graph
load_settings().then(settings => {
    options = settings.roshambo;
    calibrate_button.addEventListener('click', calibrate);
    start_button.addEventListener('click', classify);
});

//Sections: Table and Gauge
// ------------------------

// Create gauge
let gauge = new Gauge(gauge_canvas).setOptions(gaugeOptions);
gauge.maxValue = 1;

// Display the activation feature values in table
io.on('emg_burst', (data) => {
    let avg_activation = 0; // average emg_burst amongst columns
    let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
    let n_columns = Object.keys(row).length;
    columns.forEach(function (column) {
        const value = row[column]; // column value
        _td_features[column].innerHTML = (value * 100).toFixed() + "%"; // update cell content
        avg_activation = avg_activation + value
    });
    gauge.set(avg_activation / n_columns); // update the gauge level
});

// Roshambo game (Paper, Rock, Scissors)
// -------------------------------------

// Toggle Roshambo game
async function calibrate() {
    calibrate_button.classList.toggle('disabled');
    calibrate_button.disabled = true;
    roshambo = new Roshambo(io, options);
    await roshambo.calibrate();
    calibrate_button.disabled = false;
    start_button.disabled = false;
}

async function classify() {
    roshambo._init();
    // start_button.classList.toggle('disabled');
    await roshambo.classify();
    start_button.disabled = false
}

