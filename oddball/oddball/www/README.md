# An oddball protocol

This is a completely configurable oddball protocol, with visual, auditory and haptic stimuli.
Refer to the documentation in app.js for the full list of options.

## Events sent to stream ``events``

Label              | Data
-------------------| ----
``session_begins`` | ``null``
``block_begins``   | ``null``
``stim_begins``    | ``{ on: <int>, off: <int>, deviant: <boolean> }``
``stim_on``        | ``null``
``stim_off``       | ``null``
``stim_ends``      | ``null``
``block_ends``     | ``null``
``session_ends``   | ``null``

The durations provided in ``stim_begins`` are purely indicative and should not be trusted.
Epoching must be done between the ``stim_on`` and ``stim_off`` events, which reflect actual display duration.