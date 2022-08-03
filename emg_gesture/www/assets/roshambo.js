'use strict';

class Roshambo {

    /**
     * Initialize the Oddball experiment
     *
     * @param {IO} io - Timeflux IO instance
     */
    constructor(io, options = {}) {

        this.io = io;

        // Overwrite default options with given options
        let default_options = {
                'calibration_rounds': 2,
                'fixation_duration': 2000,
                'trial_duration': 7000,
            }
        ;
        this.ids = ['rock', 'paper', 'scissors', 'rest'];
        this.options = merge(default_options, options);
        // Request DOM elements to be updated
        this._element_fixation_cross = document.getElementById('fixation_cross');
        this._element_question = document.getElementById('question');
        this._element_choices = {};
        this.ids.forEach(id => this._element_choices[id] = document.getElementById(id))

    }

    /**
     * Calibration
     */
    async calibrate() {
        this.io.event('calibration_starts');
        for (let i = 0; i < this.options.calibration_rounds; i++) {
            this._shuffle(this.ids);
            for (const id of this.ids) {
                let meta = {'id': id};
                // show fixation cross
                this._element_fixation_cross.classList.toggle('show');
                await sleep(this.options.fixation_duration);
                // send an event for trial onset
                this.io.event('trial_starts', meta);
                // hide cross and show image
                this._element_fixation_cross.classList.toggle('show');
                this._element_choices[id].classList.toggle('show');
                await sleep(this.options.trial_duration);
                // send an event for trial offset
                this.io.event('trial_stops', meta);
                // stop showing
                this._element_choices[id].classList.toggle('show');
            }
        }
        this.io.event('calibration_stops');
    }

    /**
     * Prediction
     */
    async classify() {
        this.io.event('classify_starts');
        let meta = {'id': null};
        await sleep(this.options.fixation_duration);
        this.io.event('trial_starts', meta);
        // hide all choices
        this._init();
        // show image question
        this._element_question.classList.toggle('show');

        //await sleep(this.options.trial_duration);
        // Display prediction
        this.io.on('events', (data, meta) => {
            for (let timestamp in data) {
                try {
                    if (data[timestamp]['label'] == 'predict') {
                        data = JSON.parse(data[timestamp].data);
                        // hide question
                        this._init();
                        // display classification result
                        this._element_choices[data.result].classList.toggle('show');
                    }
                } catch (e) {
                }
            }
        });

        this.io.event('trial_stops', meta);

        // this._element_question.classList.toggle('show');
        // send event prediction stops
        this.io.event('classify_stops');
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

    _init() {
        const elements = document.getElementsByClassName('choice');
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('show');
        }
    }
}
