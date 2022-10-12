import numpy as np
import pandas as pd
from timeflux.core.node import Node
from timeflux.nodes.window import Slide


class MovingAverage(Slide):
    """Average the data on a rolling window
    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.

    Args:
        length (float): The length of the window, in seconds.
    """

    def __init__(self, length, step):

        super(self.__class__, self).__init__(length=length, step=step)
        self._columns = None

    def update(self):

        if not self.i.ready():
            return
        if self._columns is None:
            self._columns = self.i.data.columns

        # At this point, we are sure that we have some data to process
        super(self.__class__, self).update()

        # if the window output is ready, fit the scaler with its values
        if self.o.ready():
            time = self.i.data.index[-1]
            self.o.data = pd.DataFrame(
                np.mean(self.o.data.values, axis=0).reshape(1, -1),
                index=[time],
                columns=self._columns,
            )


class RecursiveScaler(Node):
    """Scale data with recursively updated parameters (min, max, mean..)
        Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.

    Args:
        method (str): Method of scaling (minmax or mean)
        kxargs (kwargs): Depends on the chosen smethod
            If minmax, one can et the limit range.
            If standard, one can choose either to scale with centering and/or scaling
    """

    def __init__(self, method="minmax", **kwargs):
        self._range = kwargs.get("limits")
        self._with_scaling = kwargs.get("with_scaling") or True
        self._with_centering = kwargs.get("_with_centering") or True
        self._method = method
        self.reset()

    def update(self):
        if not self.i.ready():
            return
        # copy the data and the meta
        self.o = self.i
        if self._method == "minmax":
            if self._range is not None:
                self.i.data[self.i.data > self._range[1]] = self._range[1]
                self.i.data[self.i.data > self._range[0]] = self._range[0]
            # estimate min/max of samples distribution recursively
            self._max = np.maximum(self._max, self.i.data.max())
            self._min = np.minimum(self._min, self.i.data.min())
            self.o.data = (self.i.data - self._min) / (self._max - self._min)
        else:  # self._method == "standard":
            # estimate mean/std of samples distribution recursively
            self._sum += self.i.data.sum()
            self._mean = self._signal_sum / self._n
            self._std = np.sqrt((self._sum / self._n))

            if self._with_centering:
                self.o.data -= self._mean
            if self._with_centering:
                self.o.data /= self._std

    def reset(self):
        self._max = -np.inf
        self._min = np.inf
        self._n = 0
        self._sum = 0
        self._mean = 0
        self._std = 0


class DropOutsider(Node):
    """Mask data outside range
    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.

    Args:
        left (float|None): left boundary
        right (float|None): right boundary
        include (bool): is inequality should be strict or not
        drop (bool): if True, samples outside range are dropped. Else, they're set to NaN.
    """

    def __init__(self, left=None, right=None, include=False, drop=True):
        self._left = left or -np.inf
        self._right = right or +np.inf
        self._include = include
        self._drop = drop

    def update(self):
        if not self.i.ready():
            return
        # copy the data and the meta
        self.o = self.i

        if self._include:
            _mask = (self.i.data <= self._left) | (self.i.data >= self._right)
        else:
            _mask = (self.i.data < self._left) | (self.i.data > self._right)

        if self._drop and np.sum(_mask[:].values) > 0:
            self.o.data = None
        else:
            self.o.data[_mask.values] = np.NaN
