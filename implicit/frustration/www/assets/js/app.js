"use strict";

load_settings().then((settings) => {
  let engine = new Engine(settings);
  engine.io.subscribe("model");
  engine.io.on("model", on_model);

  let instructions = document.getElementById("instructions");
  let button = document.getElementById("button");
  button.addEventListener("click", on_click);
  instructions.innerHTML =
    "Press the button when the eeg headset is calibrated";
  button.innerHTML = "Calibrated";

  async function on_click() {
    switch (engine.status) {
      case "ready":
        instructions.innerHTML = "Press start when you are ready";
        button.innerHTML = "Start";
        await engine.calibrated();
        break;
      case "calibrated":
        button.innerHTML = "Suspend";
        engine.run(instructions);
        break;
      case "running":
        instructions.innerHTML = "Suspend...";
        button.innerHTML = "Continue";
        engine.suspend();
        break;
      case "suspend":
        instructions.innerHTML = "Press Green or Red";
        button.innerHTML = "Suspend";
        engine.continue();
        break;
    }
  }

  async function on_model(data, meta) {
    for (let row of Object.values(data)) {
      switch (
        row.label
        // pass
      ) {
      }
    }
  }
});
