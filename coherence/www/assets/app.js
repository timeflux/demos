"use strict";

let io = new IO();

// Prepare elements from DOM
let _td_features = {};
const columns = ["bpm", "lf", "hf", "lf/hf"]; // columns of cardiac features
columns.forEach(function (column) {
  _td_features[column] = document.getElementById(column);
});
const td_bpm = document.getElementById("bpm");
const _gradientColors = [
  [0.0, 0.15, "#ff3030"], // no good
  [0.15, 0.3, "#ff5d4b"], // still not there
  [0.3, 0.45, "#ff8a4b"], // try to relax
  [0.45, 0.6, "#ffc04b"], // calmer
  [0.6, 0.75, "#ffe74b"], // getting closer
  [0.75, 0.9, "#9aff26"], // almost there
  [0.9, 1.1,  "#02ff8a"], // good
  [1.1, 1.5,  "#20ffff"], // great
  [1.5, 2,    "#14b5ff"], // coherence master
  [2, 3,      "#1173ff"], // super-human
];
let container = document.getElementById("circle-container");
var max = 0;
var min = 0;
var column_color = null;

// Resize circle on window
resize();
window.onresize = resize;

// Load settings from timeflux graph
load_settings().then((settings) => {
  let default_settings = {
    circle: {
      transition: { size: ".5s", color: ".5s" },
      column_color: "lf/hf",
    },
  };
  settings = merge(default_settings, settings);
  column_color = settings.circle.column_color;
  set_css_var("--size-transition", settings.circle.transition.size);
  set_css_var("--color-transition", settings.circle.transition.color);
});

// On connect, subscribe to usefull streams
io.on("connect", () => {
  console.log("connected");
  io.subscribe("rr");
  io.subscribe("radius");
  io.subscribe("cardiac_features");
});

// Scaled RR interval defines the circle radius
io.on("radius", (data) => {
  if (Object.keys(data).length > 0) {
    let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
    let column = Object.keys(row)[0]; // First column
    let value = row[column]; // Value
    value = Math.tanh(value); // Ensure value between 0 and 1
    value = 1 - Math.tanh(value); // circle radius should decrease when interval increase (ie. when BPM decrease)
    const px = value * (max - min) + min + "px"; // Transform to pixels
    set_css_var("--circle-width", px); // Set the width
    set_css_var("--circle-height", px); // Set the height
  }
});

// Display BPM in table
io.on("rr", (data) => {
  if (Object.keys(data).length > 0) {
    let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
    let column = Object.keys(row)[0]; // First column
    let value = row[column]; // Value
    // Display BPM value in table
    let bpm = 60 / value;
    td_bpm.innerHTML = bpm.toFixed(0) + " bpm";
  }
});

// lf/hf (coherence) level  defines the circle color gradient
io.on("cardiac_features", (data) => {
  let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row

  for (let column in row) {
    // Display feature value in table
    _td_features[column].innerHTML = row[column].toFixed(2);
  }
  // Set circle color from the chosen feature
  let value = row[column_color]; // Value between 0 and 1
  // circle.style.backgroundColor = color_gradient(value * 100)
  set_css_var("--circle-opacity", 0.7);
  set_css_var("--circle-color", color_gradient(value));
});

Number.prototype.between = function (a, b, inclusive = true) {
  let min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
  return inclusive ? this >= min && this <= max : this > min && this < max;
};

/**
 * Return color gradient
 *
 * @param {number}  x variable in [0, 1]
 */
function color_gradient(x) {
  let color = null;
  _gradientColors.forEach(function (_gradientInterval) {
    if (x.between(_gradientInterval[0], _gradientInterval[1])) {
      color = _gradientInterval[2];
    }
  });
  return color;
}

/**
 * Set a CSS variable
 *
 * @param {string} name: variable name in css
 * @param {string|number} value
 */
function set_css_var(name, value) {
  document.documentElement.style.setProperty(name, value);
}

/**
 * Estimate min/max of circle giveb container size
 */
function resize() {
  let width = container.clientWidth;
  let height = container.clientHeight;
  max = width < height ? width : height;
  min = max / 4;

  const px = max - min + min + "px"; // Transform to pixels
  set_css_var("--circle-width", px); // Set the width
  set_css_var("--circle-height", px); // Set the height
}
