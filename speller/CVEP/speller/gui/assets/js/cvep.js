/**
 * @file cVEP Speller
 * @author Pierre Clisson <pierre@clisson.com>
 */

'use strict';


/**
 * A cVEP grid speller
 *
 * @mixes Dispatcher
 */
class CVEP {

    /**
     * @param {Object} [options]
     * @param {string} [options.symbols] - list of characters available for the speller
     * @param {array|string} [options.pattern] - binary m-sequence
     * @param {number} [options.step] - offset between each consecutive pattern
     * @param {Object} [options.training]
     * @param {string|number} [options.training.targets] - if string, the list of characters used for training, otherwise the number of random targets
     * @param {number} [options.training.cycles] - number of cycles of the m-sequence
     * @param {Object} [options.durations]
     * @param {number} [options.durations.focus_on] - milliseconds (default: 1500)
     * @param {number} [options.durations.focus_off] - milliseconds (default: 500)
     * @param {number} [options.durations.rest] - milliseconds (default: 5000)
     * @param {Object} [options.grid]
     * @param {HTMLElement} [options.grid.element] - grid container DOM node
     * @param {number} [options.grid.columns] - number of columns in the grid
     * @param {string} [options.grid.ratio] - grid aspect ratio (examples: '1:1', '16:9', empty string means 100% width and 100% height)
     * @param {boolean} [options.grid.borders] - if the borders must be drawn
     * @param {number} [options.rate] - screen refresh rate (default: 60)
     */
    constructor(options = {}) {

        // Merge options
        let default_options = {
            symbols: 'ABCDEFGHIJKLMNOP',
            pattern: '0111110011010010000101011101100', // m-sequence, 5-bit resulting in a 31-bit sequence
            step : 2,
            training: {
                targets: 8,
                cycles: 10,
            },
            durations: {
                focus_on: 1500,
                focus_off: 500,
                rest: 5000
            },
            grid: {
                element: document.getElementById('grid'),
                columns: 4,
                ratio: '1:1',
                borders: true
            },
            //rate: 60
        };
        this.options = merge(default_options, options);

        // Set useful variables
        //this.interval = 1000 / this.options.rate;
        this.shape = {inner: {}, outer: {}};
        this.shape.inner.cols = this.options.grid.columns;
        this.shape.inner.rows = Math.ceil(this.options.symbols.length / this.options.grid.columns);
        this.shape.inner.cells = this.shape.inner.cols * this.shape.inner.rows;
        this.shape.outer.cols = this.shape.inner.cols + 2;
        this.shape.outer.rows = this.shape.inner.rows + 2;
        this.shape.outer.cells = this.shape.outer.cols * this.shape.outer.rows;

        // Draw grid
        this._make_grid();

        // Initialize states
        this.states = [];
        for (let i = 0, j = 0; i < this.shape.inner.cells; i ++, j += this.options.step) {
            this.states[i] = {
                elements: document.getElementsByClassName('shift_' + i),
                sequence: new Sequence(this.options.pattern.length, j)
            }
        }
        this.target = null; // current training target

        // Initialize events
        this.io = new IO();
        this.io.on('connect', () => this.io.event('session_begins', this.options));
        window.onbeforeunload = () => {
            this.io.event('session_ends');
        }

        // Initialize scheduler
        this.scheduler = new Scheduler();
        this.scheduler.start();
        this.callback = this._tick.bind(this);

        // Ready!
        this.status = 'ready';
    }

    /**
     * Add symbols to the grid
     */
    _make_grid() {
        let seq = new Sequence(this.shape.inner.cells, this.shape.inner.cells - this.shape.inner.cols);
        let columns = this.shape.outer.cols;
        let cells = this.shape.outer.cells;
        this.options.grid.element.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
        for (let i = 0; i < cells; i++) {
            let shift = (i % columns == 0) ? seq.prev() : seq.next();
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add('off');
            cell.classList.add('shift_' + shift);
            if (i > columns && i < cells - columns) {
                if (i % columns != 0 && i % columns != columns - 1) {
                    const symbol = this.options.symbols[shift];
                    if (symbol) {
                        cell.id = 'target_' + shift;
                        cell.textContent = symbol;
                    }
                }
            }
            this.options.grid.element.appendChild(cell);
        }
        if (!this.options.grid.borders) set_css_var('--grid-border-size', '0');
        this._resize();
        window.onresize = this._resize.bind(this);
    }

    /**
     * Adjust font size relatively to the window size
     */
    _resize() {
        // Reset
        set_css_var('--grid-width', '100%');
        set_css_var('--grid-height', '100%');
        set_css_var('--grid-padding', '0');
        set_css_var('--font-size', '0px');
        // Compute sizes
        let columns = this.shape.outer.cols;
        let rows = this.shape.outer.rows;
        let grid_width = this.options.grid.element.clientWidth;
        let grid_height = this.options.grid.element.clientHeight;
        let grid_padding = 0;
        if (this.options.grid.ratio != '') {
            let ratio = this.options.grid.ratio.split(':');
            if (ratio[0] * grid_height >= grid_width * ratio[1]) {
                let height = (ratio[1] * grid_width) / ratio[0];
                grid_padding = (grid_height - height) / 2 + "px 0";
                grid_height = height;

            } else {
                let width = (ratio[0] * grid_height) / ratio[1];
                grid_padding = "0 " + (grid_width - width) / 2 + "px";
                grid_width = width;
            }
        }
        let cell_width = grid_width / columns;
        let cell_height = grid_height / rows;
        let cell_size  = (cell_width > cell_height) ? cell_height : cell_width;
        let font_size = Math.ceil(cell_size * .5);
        // Adjust
        set_css_var('--grid-width', grid_width + 'px');
        set_css_var('--grid-height', grid_height + 'px');
        set_css_var('--grid-padding', grid_padding);
        set_css_var('--font-size',  font_size + 'px');
    }

    /**
     * Reset states
     */
    _reset() {
        for (const state of this.states) {
            for (const element of state.elements) {
                element.classList.remove('on');
            }
            state.sequence.reset();
        }
    }

    /**
     * Called on each screen refresh
     */
    _tick(scheduled, called, ellapsed, fps) {
        const frames = Math.round(ellapsed / (1000 / fps));
        //const frames = Math.round(ellapsed / this.interval); // TODO: remove
        for (let i = 0; i < frames; i ++) {

            // if (this.states[0].sequence.index == 0) {
            //     this.io.event('cycle_begins', { target: this.target });
            // }

            // Select the reference cell
            const cell = this.status == 'calibrating' ? this.target : 0;

            // Stop calibration after training.cycles + 1 to allow for a full epoch capture
            if (this.status == 'calibrating' && this.states[cell].sequence.cycle == this.options.training.cycles + 1) {
                trigger('calibrated');
                return;
            }

            // Exclude the last cycle events during training to capture only relevant EEG data
            if (this.status == 'testing' || this.states[cell].sequence.cycle < this.options.training.cycles) {
                if (this.states[cell].sequence.index % this.options.step == 0) {
                    const target = this.states[cell].sequence.index / this.options.step;
                    //console.log(cell, target, this.states[cell].sequence.cycle);
                    this.io.event('sequence', { target: target });
                }
            }

            // Update DOM and advance sequence
            for (const state of this.states) {
                const next_on = this.options.pattern[state.sequence.index] == 1;
                const curr_on = state.elements[0].classList.contains('on');
                if ((next_on && !curr_on) || (!next_on && curr_on)) {
                    for (const element of state.elements) {
                        element.classList.toggle('on');
                    }
                }
                state.sequence.next();
            }
        }
    }

    /**
     * Shuffle an array
     *
     * This is done in-place. Make a copy first with .slice(0) if you don't want to
     * modify the original array.
     *
     * @param {array} array
     *
     * @see: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
     */
    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Check if a prediction has been received or if the stop button has been pressed
     *
     * @returns {boolean}
     */
    _interrupt() {
        if (this.status == 'testing' && this.target != null) return true;
        if (this.status == 'idle') return true;
    }

    /**
     * Briefly focus on a symbol
     *
     * @param {number} target
     */
    async focus(target) {
        let element = document.getElementById('target_' + target);
        element.classList.add('focus');
        //speak(this.options.symbols[target]);
        await sleep(this.options.durations.focus_on);
        element.classList.remove('focus');
        await sleep(this.options.durations.focus_off);
    }

    /**
     * Start training
     */
    async train() {

        // Set stimulation duration
        // const wait = this.options.pattern.length * this.options.training.cycles * this.interval;

        // Set training targets
        let targets = [];
        if (Number.isInteger(this.options.training.targets)) {
            let symbols = [];
            for (let i = 0; i < this.options.training.targets; i++) {
                if (symbols.length == 0) {
                    symbols = Array.from(Array(this.options.symbols.length).keys());
                    this._shuffle(symbols);
                }
                targets.push(symbols.shift());
            }
        } else {
            for (const target of this.options.training.targets) {
                targets.push(this.options.symbols.indexOf(target));
            }
        }

        // Start training
        this.status = 'calibrating';
        this.io.event('training_begins', { targets: targets }); // TODO: rename to accumulation_starts
        //for (const target of targets) {
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            this.target = target;
            this.io.event('focus_begins', { target: target });
            await this.focus(target);
            this.io.event('focus_ends');
            this.scheduler.on('tick', this.callback);
            //await sleep(wait);
            await flag('calibrated')
            this.scheduler.off('tick', this.callback);
            this._reset();
            if (i < targets.length - 1) {
                await sleep(this.options.durations.rest);
            }
        }
        this.target = null;
        this.io.event('training_ends');  // TODO: rename to accumulation_ends
        // TODO: WAIT for a full epoch and send a training_starts event
        this.status = 'idle';
    }

    /**
     * Start testing
     */
    async test() {
        this.io.event('testing_begins');
        this.status = 'testing';
        this.scheduler.on('tick', this.callback);
        while (this.status == 'testing') {
            if (this.target != null) {
                // We got a prediction
                this.scheduler.off('tick', this.callback);
                //console.log("Off: " + microtime());
                this._reset();
                await this.focus(this.target, this.options.durations.focus);
                this.target = null;
                this.scheduler.on('tick', this.callback);
                //console.log("On: " + microtime());
            }
            await sleep(1);
        }
        this.scheduler.off('tick', this.callback);
        this.io.event('testing_ends');
        this._reset();
    }

    /**
     * Stop testing
     */
    stop() {
        if (this.status == 'testing') {
            this.status = 'idle';
        }
    }

    /**
     * Set the prediction
     */
    predict(target) {
        if (this.status == 'testing') this.target = target;
    }

}

//Object.assign(CVEP.prototype, Dispatcher);


class Sequence {

    constructor(length, start=0) {
        this.length = length;
        this.start = start;
        this.index = start;
        this.cycle = 0;
    }

    next() {
        this.index++;
        if (this.index == this.length) {
            this.index = 0;
        }
        if (this.index == this.start) {
            this.cycle ++;
        }
        return this.index;
    }

    prev() {
        this.index--;
        if (this.index == -1) {
            this.index = this.length - 1;
        }
        if (this.index == this.start) {
            this.cycle ++;
        }
        return this.index;
    }

    reset() {
        this.index = this.start;
        this.cycle = 0;
    }

}


/**
 * Set a CSS variable
 *
 * @param {string} variable name
 * @param {string|number} value
 */
function set_css_var(name, value) {
    document.documentElement.style.setProperty(name, value);
}

/**
 * Get a CSS variable
 *
 * @param {string} variable name
 */
function get_css_var(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/**
 * Text to speech synthesis
 *
 * @param {string} text
 */
function speak(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}
