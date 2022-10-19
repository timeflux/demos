# Implicit frustration

Implicit Frustration application based on [Neuroadaptive technology enables implicit cursor
control based on medial prefrontal cortex activity](https://www.pnas.org/doi/abs/10.1073/pnas.1605155114).

## Setting up

### With fake or recorded data (no device)

The default configuration uses real recorded data. You can also try sinusoidal waves by commenting out the `replay.yaml` graph in `main.yaml` and uncomment `sinus.yaml`.

### Using a Muse device

Steps to acquire EEG using muse 2016 BLED by Muse in LSL
    - stream the LSL using muse_stream.sh
    - launch the application using timeflux : timeflux muse.yaml
    - uncomment the `muse.yaml` graph in `main.yaml` file, and comment out the other input graphs. 
### Using a Unicorn device  by G.TEC through Brainflow

### Using a Unicorn device

Uncomment the `unicorn.yaml` graph in `main.yaml` file, and comment out the other input graphs. 

## Running the demo

Launch the app:

```
$ timeflux -d implicit/frustration/main.yaml
```

Open a browser, and visualize:

- [The raw EEG data](http://localhost:8000/monitor/)
- [The application to perform the experiment](http://localhost:8000/frustration/)

![demo-bands-eeg](img/interface.gif)

See [GUI](gui) for application details.

TODO : explain the experiment !! @sylvain ? 
## Data visualization 

Have a look at the python script to analyse and visualize the data offline. 

```
 python implicit/frustration/analysis/visualization.py
```

TODO : explain what we plot !! @sylvain ? 