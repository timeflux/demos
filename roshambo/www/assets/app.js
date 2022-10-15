"use strict";

let roshambo = null;
let options = {};

// Prepare DOM elements
const calibrateBtn = document.getElementById("calibrate");
const startBtn = document.getElementById("start");
const geaugeElmt = document.getElementById("gauge_canvas");
const tdElmts = {
  A1_EMG: document.getElementById("A1_EMG"),
  A2_EMG: document.getElementById("A2_EMG"),
};

// Define gauge options
const gaugeOptions = {
  lines: 1,
  angle: 0,
  lineWidth: 0.2,
  pointer: {
    legth: 0.9,
    strokeWidth: 0,
    color: "#ccc",
  },
  limitMax: "false",
  percentColors: [
    [0.0, "#ffe74b"],
    [0.2, "#ffc04b"],
    [0.4, "#ff8a4b"],
    [0.6, "#ff5d4b"],
    [0.8, "#ff3030"],
  ],
  strokeColor: "#E0E0E0",
  generateGradient: true,
};

// Timeflux IO
// -----------
let io = new IO();

// subscribe to useful streams on new connection
io.on("connect", () => {
  console.log("connected");
  io.subscribe("events");
  io.subscribe("burst");
});

// Load settings from UI timeflux graph
load_settings().then((settings) => {
  options = settings.roshambo;
  calibrateBtn.addEventListener("click", calibrate);
  startBtn.addEventListener("click", classify);
});

// Sections: Table and Gauge
// ------------------------

// Create gauge
let gauge = new Gauge(geaugeElmt).setOptions(gaugeOptions);
gauge.maxValue = 1;

// Display the activation feature values in table
io.on("burst", (data) => {
  const row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
  tdElmts["A1_EMG"].innerHTML = (row["A1_EMG"] * 100).toFixed() + "%"; // update A1 cell content
  tdElmts["A2_EMG"].innerHTML = (row["A2_EMG"] * 100).toFixed() + "%"; // update A2 cell content
  gauge.set((row["A1_EMG"] + row["A2_EMG"]) / 2); // update the gauge level
});

// Roshambo game (Paper, Rock, Scissors)
// -------------------------------------

// Toggle Roshambo game
const calibrate = async () => {
  calibrateBtn.classList.toggle("disabled");
  calibrateBtn.disabled = true;
  roshambo = new Roshambo(io, options);
  await roshambo.calibrate();
  calibrateBtn.disabled = false;
  startBtn.disabled = false;
};

const classify = async () => {
  roshambo._init();
  //   start_button.classList.toggle('disabled');
  await roshambo.classify();
  startBtn.disabled = false;
};
