# Cardiac coherence

In this demo, we acquire heart signal using ECG sensor, we detect heart beats, estimate HRV in realtime and then HRV spectrum. This allows us to compute "coherence" biomarkers, that is the ratio between low frequency and high frequency. The feedback is a circle which radius depends on heart rate and color depends on coherence level.

## Setting up

### With artificial or recorded data (no device)

The default configuration uses artificial data (sinusoidal waves). You can also try pre-recorded data by commenting out the `sinus.yaml` graph in `main.yaml` and uncommenting `replay.yaml`.

### Using a BITalino device

You need to plug the ECG at input A1 of your device and positions the electrodes as follows:

<img src="images/montage_ecg.png" width="40%">

⚠️ If you revert the IN+ (red) and IN- (black) electrodes, the ECG QRS will be inverted and the cardiac peaks won't be estimated correctly.

## Demo 

```bash
$ timeflux -d coherence/main.yaml
```

Then, open <http://localhost:8000/coherence/>. 

![demo-coherence-ecg](images/interface.gif)

Feedback color scale: 

- ![#ff3030](https://via.placeholder.com/15/ff3030/ff3030.png) no good 
- ![#ff5d4b](https://via.placeholder.com/15/ff5d4b/ff5d4b.png) still not there 
- ![#ff8a4b](https://via.placeholder.com/15/ff8a4b/ff8a4b.png) try to relax
- ![#ffc04b](https://via.placeholder.com/15/ffc04b/ffc04b.png) calmer
- ![#ffe74b](https://via.placeholder.com/15/ffe74b/ffe74b.png) getting closer
- ![#9aff26](https://via.placeholder.com/15/9aff26/9aff26.png) almost there
- ![#02ff8a](https://via.placeholder.com/15/02ff8a/02ff8a.png) good
- ![#20ffff](https://via.placeholder.com/15/20ffff/20ffff.png) great
- ![#14b5ff](https://via.placeholder.com/15/14b5ff/14b5ff.png) coherence master
- ![#1173ff](https://via.placeholder.com/15/1173ff/1173ff.png) super-human
