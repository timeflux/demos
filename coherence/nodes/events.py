import pandas as pd

from timeflux.core.node import Node


class EventToSignal(Node):
    """ Serialize one column

    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame and meta.
    Args:
        meta_keys (list): List of meta keys to get value from
        labels (list|None): List of labels to match
        drop_label (bool): Whether or not to drop the label column

    Example:
    -------
    >>> events = tm.makeTimeDataFrame(5, freq='L').rename(columns={'A': 'label', 'B': 'data'})
    >>> labels = ['foo', 'bar', 'zaz', 'rer', 'foo']
    >>> data = [{'a': 1, 'b': 10}, {'a': 2, 'b': 20}, {}, {}, {'a': 1, 'c': 2},]
    >>> events.label = labels
    >>> events.data = data
    >>> events
                                label               data
        2000-01-01 00:00:00.000   foo  {'a': 1, 'b': 10}
        2000-01-01 00:00:00.001   bar  {'a': 2, 'b': 20}
        2000-01-01 00:00:00.002   zaz                 {}
        2000-01-01 00:00:00.003   rer                 {}
        2000-01-01 00:00:00.004   foo   {'a': 1, 'c': 2}
    >>> node = ToSignal(labels=['bar', 'foo'], meta_keys=['a', 'b'])
    >>> node.update()
    >>> node.o.data
                                label  a     b
        2000-01-01 00:00:00.001   bar  2  20.0
        2000-01-01 00:00:00.000   foo  1  10.0
        2000-01-01 00:00:00.004   foo  1   NaN
    """

    def __init__(self, meta_keys, labels=None, drop_label=True):
        if isinstance(labels, str):
            labels = [labels]
        self._labels = labels
        if isinstance(meta_keys, str):
            meta_keys = [meta_keys]
        self._meta_keys = meta_keys
        self._drop_label = drop_label

    def update(self):
        if not self.i.ready():
            return

        # copy the data and the meta
        self.o = self.i
        if self._labels is not None:
            idx = self.i.data.label.isin(self._labels)
            self.i.data = self.i.data.loc[idx]

        selected_meta = pd.DataFrame(index=self.i.data.index, columns=self._meta_keys)

        for meta_key in self._meta_keys:
            selected_meta[meta_key] = [a[meta_key] for a in self.i.data['data'].values]

        self.o.data = selected_meta

        if not self._drop_label:
            self.o.data = pd.concat([self.i.data[['label']], self.o.data], axis=1)
