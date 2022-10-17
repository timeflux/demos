# Frequency Bands (EEG)

This demonstrates how one could implement a simple neurofeedback application.

## Setting up

### With fake or replayed data (no device)

You just need to comment the bitalino graph in main.yaml and instead uncomment the sinus graph (for sinusoidal input) or the replay graph (for replayed data).

### Using a BITalino device

Uncomment the `bitalino.yaml` graph in `main.yaml` file, and comment out the default `replay.yaml` graph.

You then need to plug the EEG sensor in input A1, and position the electrodes as follows:

 ![Application screenshot](images/bitalino.jpg | width=250)

## Running the demo

Launch the app:

```
$ timeflux -d neurofeedback/bands/main.yaml
```

Open a browser, and visualize:

- [The raw EEG data](http://localhost:8000/monitor/)
- [The relative and absolute frequency bands for the `Fpz` channel](http://localhost:8000/bands/)


![demo-bands-eeg](images/interface.gif)


