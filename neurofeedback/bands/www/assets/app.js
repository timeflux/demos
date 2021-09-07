'use strict';

// Connect to socket
let io = new IO();

// Subscribe to data stream
io.subscribe('bands');

// Connect event
io.on('connect', () => {
   console.log('connected')
});

// Load settings from YAML graph
load_settings().then(settings => {
    console.log(settings);
});

// Get DOM elements
let elements = {};
for (let band of ['delta', 'theta', 'alpha', 'beta', 'gamma']) {
    elements[band] = {
        'absolute': document.getElementById(band + '_absolute'),
        'relative': document.getElementById(band + '_relative'),
        'progress': document.getElementById(band + '_progress')
    };
}

// Update
io.on('bands', (data) => {
    // Get last row of data
    let keys = Object.keys(data);
    let row = data[keys[keys.length - 1]];
    // Compute total power
    // We assume there is only one channel
    let total = Object.values(row).reduce((a, b) => a + b, 0);
    // Compute relative values and update table
    for (let key in row) {
        let band = key.split('_')[1]; // We assume there is only one channel
        let absolute = row[key];
        let relative = absolute * 100 / total;
        elements[band]['absolute'].innerHTML = absolute.toFixed(2);
        elements[band]['relative'].innerHTML = relative.toFixed(2);
        elements[band]['progress'].value = relative;
    }
});

