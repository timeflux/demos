"use strict";

class Roshambo {
  /**
   * Initialize the Oddball experiment
   *
   * @param {IO} io - Timeflux IO instance
   */
  constructor(io, options = {}) {
    this.io = io;

    // Overwrite default options with given options
    const default_options = {
      calibration_rounds: 2,
      fixation_duration: 2000,
      trial_duration: 7000,
    };
    this.ids = ["rock", "paper", "scissors", "rest"];
    this.options = merge(default_options, options);
    // Request DOM elements to be updated
    this._element_fixation_cross = document.getElementById("fixation_cross");
    this._element_question = document.getElementById("question");
    this._element_choices = {};
    this.ids.forEach(
      (id) => (this._element_choices[id] = document.getElementById(id))
    );
  }

  /**
   * Calibration
   */
  async calibrate() {
    this.io.event("calibration_starts");
    for (let i = 0; i < this.options.calibration_rounds; i++) {
      this._shuffle(this.ids);
      for (const id of this.ids) {
        let meta = { id: id };
        // show fixation cross
        this._element_fixation_cross.classList.toggle("show");
        await sleep(this.options.fixation_duration);
        // send an event for trial onset
        this.io.event("trial_starts", meta);
        // hide cross and show image
        this._element_fixation_cross.classList.toggle("show");
        this._element_choices[id].classList.toggle("show");
        await sleep(this.options.trial_duration);
        // send an event for trial offset
        this.io.event("trial_stops", meta);
        // stop showing
        this._element_choices[id].classList.toggle("show");
      }
    }
    this.io.event("calibration_stops");
  }

  /**
   * Show prediction
   */
  predict(result) {
    for (const [id, el] of Object.entries(this._element_choices)) {
      el.classList.remove("show");
    }
    this._element_choices[result].classList.toggle("show");
  }

  /**
   * Shuffle an array
   *
   * This is done in-place. Make a copy first with .slice(0) if you don't want to
   * modify the original array.
   *
   * @param {array} array
   *
   * @see:https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

}
