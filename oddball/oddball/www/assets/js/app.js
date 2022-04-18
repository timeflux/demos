'use strict';

let io = new IO();

const button = document.getElementById('start');

const synth = new Tone.Synth({
  oscillator: {
    type: 'triangle'
  },
  envelope: {
    attack: 0.001,
    release: 0.001
  }
}).toMaster()

load_settings().then(settings => {
    let oddball = new Oddball(io, settings.oddball);
    button.addEventListener('click', () => {
        if (Tone.context.state === 'suspended') Tone.start();
        oddball.start();
    });
});


class Oddball {

    /**
     * Initialize the Oddball experiment
     *
     * @param {Object} [visual]
     * @param {boolean} [visual.enabled] - set to true to enable visual stimuli
     * @param {string} [visual.background_color] - main background color
     * @param {number} [visual.cell_size] - grid cell size, in px
     * @param {string} [visual.background_color_off] - grid backgound color between stims
     * @param {string} [visual.foreground_color_off] - cell color between stims
     * @param {string} [visual.background_color_standard] - grid backgound color on standard stims
     * @param {string} [visual.foreground_color_standard] - cell color on standard stims
     * @param {string} [visual.background_color_deviant] - grid backgound color on odd stims
     * @param {string} [visual.foreground_color_deviant] - cell color on odd stims
     * @param {number} [visual.marker_size] - marker size, in px
     * @param {string} [visual.marker_color] - marker color
     * @param {number} [visual.marker_thickness] - marker thickness, in px
     * @param {Object} [auditory]
     * @param {boolean} [auditory.enabled] - set to true to enable auditory stimuli
     * @param {number} [auditory.frequency_standard] - tone frequency, in Hz, on standard stims
     * @param {number} [auditory.frequency_deviant] - tone frequency, in Hz, on odd stims
     * @param {number} [auditory.volume_standard] - volume (0-1) on standard stims
     * @param {number} [auditory.volume_deviant] - volume (0-1) on odd stims
     * @param {Object} [haptic]
     * @param {boolean} [haptic.enabled] - set to true to enable haptic stimuli
     * @param {number|number[]} [haptic.pattern_standard] - vibration pattern on standard stims
     * @param {number|number[]} [haptic.pattern_deviant] - vibration pattern on odd stims
     * @param {Object} [photodiode]
     * @param {boolean} [photodiode.enabled] - set to true to enable visual stimuli
     * @param {Object} [stim]
     * @param {number} [stim.duration_min_on] - minimum stim duration, in ms
     * @param {number} [stim.duration_max_on] - maximum stim duration, in ms
     * @param {number} [stim.duration_min_off] - minimum duration between stims, in ms
     * @param {number} [stim.duration_max_off] - maximum duration between stims, in ms
     * @param {number} [stim.probabilty_deviant] - probability of odd stims (0-1)
     * @param {Object} [session]
     * @param {number} [session.blocks_per_session] - number of blocks per session
     * @param {number} [session.stims_per_block] - number of stims per block
     * @param {number} [session.prep_duration] - preparation duration before session starts, in ms
     * @param {number} [session.rest_duration] - rest duration between blocks, in ms
     * @param {string} [session.session_start_message] - NOT IMPLEMENTED
     * @param {string} [session.session_stop_message] - NOT IMPLEMENTED
     * @param {string} [session.block_start_message] - NOT IMPLEMENTED
     */
    constructor(io, options = {}) {

        // Default options
        let default_options = {
            visual: {
                enabled: true,
                background_color: '#CCCCCC',
                cell_size: 40,
                background_color_off: '#808080',
                foreground_color_off: '#CCCCCC',
                background_color_standard: '#CCCCCC',
                foreground_color_standard: '#808080',
                background_color_deviant: '#FFFF00',
                foreground_color_deviant: '#FF0000',
                marker_size: 60,
                marker_color: '#000000',
                marker_thickness: 6
            },
            auditory: {
                enabled: true,
                frequency_standard: 750,
                frequency_deviant: 1000,
                volume_standard: 0.5,
                volume_deviant: 0.6
            },
            haptic: {
                enabled: true,
                pattern_standard: 50,
                pattern_deviant: 100
            },
            photodiode: {
                enabled: false,
                size: 60
            },
            stim: {
                duration_min_on: 100,
                duration_max_on: 100,
                duration_min_off: 1000,
                duration_max_off: 1300,
                probabilty_deviant: 0.2
            },
            session: {
                blocks_per_session: 3,
                stims_per_block: 50,
                prep_duration: 3000,
                rest_duration: 10000,
                session_start_message: 'Press the button to start',
                session_stop_message: 'Thanks!',
                block_start_message: ''
            }
        };

        // Merge options and send them as meta
        this.options = merge(default_options, options);
        this.io = io;

        // Send start and stop events
        this.io.on('connect', () => this.io.event('app_starts', this.options));
        window.onbeforeunload = () => {
            this.io.event('app_stops');
        }

        // Create HTML elements
        this.container = document.createElement('div');
        this.container.className = 'checkerboard center hidden no_cursor';
        this.marker = document.createElement('div');
        this.marker.className = 'marker center hidden no_cursor';
        this.photodiode = document.createElement('div');
        this.photodiode.className = 'photodiode hidden';
        document.body.appendChild(this.container);
        document.body.appendChild(this.marker);
        document.body.appendChild(this.photodiode);

        // Compute margins so the grid is centered and we have only plain cells
        this._resize();
        window.onresize = this._resize.bind(this);

        // Set CSS
        set_css_var('--back', this.options.visual.background_color);
        set_css_var('--cell-size', this.options.visual.cell_size + 'px');
        set_css_var('--back-on', this.options.visual.background_color_standard);
        set_css_var('--back-off', this.options.visual.background_color_off);
        set_css_var('--front-on', this.options.visual.foreground_color_standard);
        set_css_var('--front-off', this.options.visual.foreground_color_off);
        set_css_var('--back-odd', this.options.visual.background_color_deviant);
        set_css_var('--front-odd', this.options.visual.foreground_color_deviant);
        set_css_var('--marker-size', this.options.visual.marker_size + 'px');
        set_css_var('--marker-color', this.options.visual.marker_color);
        set_css_var('--marker-thickness', this.options.visual.marker_thickness + 'px');
        set_css_var('--photodiode-size', this.options.photodiode.size + 'px');

        // Infinite scheduler to work around Chrome bug
        this.scheduler = new Scheduler();
    }

    async start() {
        button.classList.toggle('hidden');
        this.scheduler.start();
        this.container.classList.toggle('hidden');
        this.marker.classList.toggle('hidden');
        if (this.options.photodiode.enabled) {
            this.photodiode.classList.toggle('hidden');
        }
        await sleep(this.options.session.prep_duration);
        this.io.event('session_begins');
        for (let block = 0; block < this.options.session.blocks_per_session; block++) {
            this.io.event('block_begins');
            for (let stim = 0; stim < this.options.session.stims_per_block; stim++) {
                let duration_on = this._random(this.options.stim.duration_min_on, this.options.stim.duration_max_on);
                let duration_off = Math.round(this._random(this.options.stim.duration_min_off, this.options.stim.duration_max_off));
                let deviant = Math.random() <= this.options.stim.probabilty_deviant ? true : false;
                this.io.event('stim_begins', { on: duration_on, off: duration_off, deviant: deviant });
                let now = performance.now();
                await this.scheduler.asap(() => {
                    if (this.options.visual.enabled) {
                        this.container.classList.add(deviant ? 'odd' : 'on');
                        this.container.classList.remove('off');
                        this.marker.classList.add(deviant ? 'odd' : 'on');
                    }
                    if (this.options.photodiode.enabled) {
                        this.photodiode.classList.toggle('on');
                    }
                    if (this.options.auditory.enabled) {
                        if (deviant) {
                            beep(this.options.auditory.volume_deviant, this.options.auditory.frequency_deviant, duration_on);
                        } else {
                            beep(this.options.auditory.volume_standard, this.options.auditory.frequency_standard, duration_on);
                        }
                    }
                    if (this.options.haptic.enabled) {
                        if (deviant) {
                            vibrate(this.options.haptic.probabilty_deviant);
                        } else {
                            vibrate(this.options.haptic.probabilty_standard);
                        }
                    }
                    this.io.event('stim_on');
                });
                await sleep(duration_on);
                await this.scheduler.asap(() => {
                    if (this.options.visual.enabled) {
                        this.container.classList.remove(deviant ? 'odd' : 'on');
                        this.container.classList.add('off');
                        this.marker.classList.remove(deviant ? 'odd' : 'on');
                    }
                    if (this.options.photodiode.enabled) {
                        this.photodiode.classList.toggle('on');
                    }
                    this.io.event('stim_off');
                });
                await sleep(duration_off);
                this.io.event('stim_ends');
            }
            this.container.classList.remove('off');
            this.io.event('block_ends');
            if (block + 1 < this.options.session.blocks_per_session) {
                await sleep(this.options.session.rest_duration);
            }
        }
        this.io.event('session_ends');
        this.container.classList.toggle('hidden');
        this.marker.classList.toggle('hidden');
        if (this.options.photodiode.enabled) {
            this.photodiode.classList.toggle('hidden');
        }
        button.classList.toggle('hidden');
        this.scheduler.stop();
    }

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     *
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    _random(min, max) {
        return Math.random() * (max - min) + min;
    }

    _resize() {
        let cell_size = this.options.visual.cell_size
        let width = Math.floor(window.innerWidth / this.options.visual.cell_size) * this.options.visual.cell_size;
        let height = Math.floor(window.innerHeight / this.options.visual.cell_size) * this.options.visual.cell_size;
        this.container.style.width = width + 'px';
        this.container.style.height = height + 'px';
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


function beep(volume, frequency, duration) {
    synth.triggerAttackRelease(frequency, duration / 1000, undefined, volume);
}


function vibrate(pattern) {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}


