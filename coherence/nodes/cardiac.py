from timeflux.core.node import Node
import numpy as np
import pandas as pd


class CardiacFreqMarkers(Node):
    """Cardiac marker based on frequency

    Attributes:
        i_lf (Port): Low Frequency power, expects DataFrame.
        i_hf (Port): High Frequency power, expects DataFrame.
        o (Port): Default output, provides DataFrame with column 'lf', 'hf', and 'lf/hf' and meta.
    """

    def update(self):
        if not (self.i_lf.ready() & self.i_hf.ready()):
            return

        self.o.meta = self.i_lf.meta

        self.o.data = pd.concat([self.i_lf.data, self.i_hf.data], axis=1)
        self.o.data.columns = ['lf', 'hf']
        self.o.data.loc[:, 'lf/hf'] = (self.o.data['lf'] / self.o.data['hf']) / 6
