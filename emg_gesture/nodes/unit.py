from timeflux.core.node import Node


class ConvertUnit(Node):
    """Convert raw units to physical units.


     Each sensor and device has a specific transfer function that models the inputs
     to outputs. This transfer function is, thus, used in order to convert the
     raw units that are measured to physical units that originated the data.

     This functions makes the conversion of raw units to physical units, using the
     information of sensor and device.

    Attributes:
        i (Port): Default input, expects DataFrame.
        o (Port): Default output, provides DataFrame.

    Args:
        resolution (int): 10 if [A1, A2, A3, A4], else 6

    Notes:
        See Bitalino documentation: https://bitalino.com/en/table-comparar

    """

    def __init__(self, resolution=10):
        super().__init__()
        self._resolution = resolution

    def update(self):

        if not self.i.ready():
            return
        self.o.meta = self.i.meta
        self.o.meta["unit"] = "mV"
        vcc = 3.3
        offset = 0.5
        gain = 1.1
        self.o.data = (
            (self.i.data * vcc / (2**self._resolution)) - vcc * offset
        ) / gain
