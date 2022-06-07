Implicit Frustration application based on [Neuroadaptive technology enables implicit cursor
control based on medial prefrontal cortex activity](https://www.pnas.org/doi/abs/10.1073/pnas.1605155114).

The application is already implemented for two eeg headsets:
- the muse 2016 BLED by Muse in LSL
    - stream the LSL using muse_stream.sh
    - launch the application using timeflux : timeflux muse.yaml
- the unicorn by G.TEC through Brainflow
    - just launch the application using timeflux : timeflux unicorn.yaml

See [GUI](../../tree/main/implicit/frustration/gui) for application details.