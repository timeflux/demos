# Cardiac (ECG) 
In this demo, we acquire heart signal using ECG sensor, we detect heart beats, estimate HRV in realtime and then HRV spectrum, to compute "coherence" biomarkers that is the ratio between low frequency and high frequency. The feedback is a circle which radius depends on heart rate and the color depends on coherence level. The idea is to be able to control this circle.  

## Sensor montage
You need to plug the ECG at inpuut A1 of Bitalino and place the electrode as follow: 

 <img src="img/montage_ecg.png" width="40%">
 
⚠️ If you revert the IN+ (red) and IN-(black) electrodes, the ECG QRS will be inverted and the cardiac peaks won't be estimated correctly.   


## Demo 

```bash
	timeflux -d coherence/main.yaml
```

Then, open <http://localhost:8000/coherence/>. 

![demo-coherence-ecg](img/demo_coherence.gif)

Feedback color scale: 
- ![#ff3030](https://via.placeholder.com/15/ff3030/ff3030.png) no good 
- ![#ff5d4b](https://via.placeholder.com/15/ff5d4b/ff5d4b.png) still not there 
- ![#ff8a4b](https://via.placeholder.com/15/ff8a4b/ff8a4b.png) try harder 
- ![#ffc04b](https://via.placeholder.com/15/ffc04b/ffc04b.png) calm state
- ![#ffe74b](https://via.placeholder.com/15/ffe74b/ffe74b.png) getting closer
- ![#9aff26](https://via.placeholder.com/15/9aff26/9aff26.png) almost there
- ![#02ff8a](https://via.placeholder.com/15/02ff8a/02ff8a.png) coherence master
- ![#20ffff](https://via.placeholder.com/15/20ffff/20ffff.png) above Coherence master
- ![#14b5ff](https://via.placeholder.com/15/14b5ff/14b5ff.png) this is color for Ghandi meditating
- ![#1173ff](https://via.placeholder.com/15/1173ff/1173ff.png) this should never happen, but who knows if there's a god!


## With fake or replayed data (no device)
You just need to comment the bitalino graph in main.yaml and instead uncomment the sinus graph (for sinusoidal input) or the replay graph (for replayed data).