'use strict';

let cvep = null;

load_settings().then(settings => {

    cvep = new CVEP(settings.cvep);
    cvep.io.subscribe('model');
    cvep.io.on('model', on_message);

    let instructions = document.getElementById('instructions');
    let button = document.getElementById('button');
    button.addEventListener('click', on_click);

    const overlay = document.getElementById('overlay');
    let accumulation = {
        accumulation: null,
        scoring: null,
        threshold: null,
        min_buffer_size: null,
        max_buffer_size: null,
        //recovery: null,
    };

    async function on_click() {
        switch (cvep.status) {
            case 'ready':
                button.disabled = true;
                await cvep.train();
                button.innerHTML = 'Start';
                instructions.innerHTML = 'Please wait while the model is fitting.';
                break;
            case 'idle':
                instructions.innerHTML = '';
                button.innerHTML = 'Stop';
                await cvep.test();
                button.innerHTML = 'Start';
                button.disabled = false;
                break;
            case 'testing':
                button.disabled = true;
                cvep.stop();
                break;
        }
    }

    // Keystroke listening
    window.addEventListener('keydown', (event) => {
        if (event.key == 's') {
            overlay.classList.toggle('hidden');
        }
/*
        if (grid == null) return;
        if (command) grid._update(command);
*/
    })

    // Accumulation setttings
    cvep.io.event('get_cvep_accumulation');
    // Sliders
    for (let setting of ['threshold', 'min_buffer_size', 'max_buffer_size']) {
        let value = document.getElementById(setting + '-value');
        document.getElementById(setting + '-slider').addEventListener('input', (event) => {
            value.innerHTML = event.target.value;
            accumulation[setting] = parseFloat(event.target.value);
        });
        document.getElementById(setting + '-slider').addEventListener('change', (event) => {
            cvep.io.event('reset_cvep_accumulation', accumulation);
        });
    }
    // Dropdowns
    for (let setting of ['accumulation', 'scoring'])
    document.getElementById(setting).addEventListener('change', (event) => {
        accumulation[setting] = event.target.value;
        cvep.io.event('reset_cvep_accumulation', accumulation);
    });

    function on_message(data, meta) {
        //console.log("Message: " + microtime());
        //console.log(microtime() - Object.keys(data)[0]);
        for (let row of Object.values(data)) {
            switch (row.label) {
                case 'ready':
                    if (cvep.status == 'idle') {
                        instructions.innerHTML = '';
                        button.disabled = false;
                    }
                    break;
                case 'predict':
                    if (cvep.status == 'testing') {
                        console.log(row.data);
                        let symbol =  cvep.options.symbols[row.data.target];
                        let message = instructions.innerHTML + symbol;
                        message = message.substring(message.length - 30, message.length)
                        instructions.innerHTML = message;
                        cvep.predict(row.data.target);
                    }
                    break;
                case 'accumulation':
                    for (let setting of ['threshold', 'min_buffer_size', 'max_buffer_size']) {
                        document.getElementById(setting + '-slider').value = row.data[setting];
                        document.getElementById(setting + '-value').innerHTML = row.data[setting];
                    }
                    for (let setting of ['accumulation', 'scoring']) {
                        document.getElementById(setting).value = row.data[setting];
                    }
                    break;
            }
        }
    }

});
