import numpy as np
import pandas as pd
from scipy.stats import linregress
from timeflux.core.node import Node

class TKEO(Node):
    """TKEO : Teager–Kaiser energy operator
    Known to increase the EMG onset detection
    
    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.

    """

    def __init__(self):
        self._previous = None
        self._columns = None

    def update(self):
        if not self.i.ready():
            return
            
        self.o.meta = self.i.meta 

        if self._columns is None:
            self._columns = self.i.data.columns
        else:
            self.i.data = pd.concat(
                [self._previous, self.i.data]
            ) 
        x = self.i.data.values
        tkeo = np.power(x[1:-1], 2) - np.multiply(x[2:], x[:-2])
        self._previous = self.i.data
        self.o.data = pd.DataFrame(
            tkeo, columns=self._columns, index=self.i.data.index[1:-1]
        )


class DetectBurst(Node):
    """Detect EMG activation  Burst
    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.
    """

    def __init__(self, intensity):
        self._intensity = intensity

        self._signal_sum = None
        self._signal_samples = 0
        self._energy_max = None
        self._last_burst = pd.DataFrame()
        self._labels = {-1: "burst_ends", 1: "burst_begins"}
        self._previous = pd.DataFrame()
        self._threshold = None
        self._signal_ready = self._energy_ready = False
        self._above_thres = []

    def update(self):
        self._update_threshold()

        if self.i_energy.ready() and self._threshold is not None:
            # if we want a boolean activation
            # burst = (self._previous.append(self.i_energy.data) > self._threshold).astype(float)
            self._above_thres.append(
                self.i_energy.data[self.i_energy.data > self._threshold]
            )

            _tmp = pd.concat(self._above_thres).dropna()
            _max = _tmp.mean() + _tmp.std()  # todo; until convergence!
            # if we want scaled activation between 0 and 1
            burst = self._previous.append(self.i_energy.data)
            burst = burst / _max

            self.o.data = burst
            self._previous = self.i_energy.data.iloc[[-1], :]

    def _update_threshold(self):
        if self.i_signal.ready():
            self._signal_samples += len(self.i_signal.data)
            if not self._signal_ready:
                self._signal_sum = self.i_signal.data.sum()
                self._signal_mean = self._signal_sum / self._signal_samples
                self._signal_sumsq = (
                    (self.i_signal.data - self._signal_mean) ** 2
                ).sum()
                self._signal_std = self._signal_sumsq / self._signal_samples
                self._signal_ready = True
            else:
                self._signal_sum += self.i_signal.data.sum()
                self._signal_mean = self._signal_sum / self._signal_samples
                self._signal_std = np.sqrt((self._signal_sumsq / self._signal_samples))
        if self.i_energy.ready():
            if not self._energy_ready:
                self._energy_max = self.i_energy.data.max()
                self._energy_ready = True
            else:
                self._energy_max = np.maximum(
                    self._energy_max, self.i_energy.data.max()
                )

        if self._signal_ready and self._energy_ready:
            self._threshold_0_perc_level = (-self._signal_mean) / self._signal_std
            self._threshold_100_perc_level = (
                self._energy_max - self._signal_mean
            ) / self._signal_std
            self._threshold = pd.concat(
                [self._threshold_0_perc_level, self._threshold_100_perc_level], axis=1
            ).apply(self._estimate_threshold, axis=1)

    def _estimate_threshold(self, x):
        """
        Regression function that with a percent input gives an absolute value of the threshold
        level (used in the muscular activation detection algorithm).
        Converts a relative threshold level to an absolute value.
        """
        self._slope, self._intercept = linregress([0, 100], x.values)[:2]
        return self._slope * self._intensity + self._intercept
