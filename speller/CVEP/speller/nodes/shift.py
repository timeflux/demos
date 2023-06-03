import json
import numpy as np
from timeflux.core.node import Node

class Shift(Node):
    """Shift CVEP predictions

    Attributes:
        i (Port): Single-trial predictions from the ML node, expects DataFrame.
        o (Port): Shifted predictions, provides DataFrame
    """

    def update(self):
        if self.i.ready():
            self.o = self.i
            if "epochs" in self.o.meta:
                meta = iter(self.o.meta["epochs"])
            for timestamp, row in self.i.data.iterrows():
                if row.label == "predict_proba":
                    data = json.loads(row["data"])
                    scores = data["result"]
                    target = next(meta)["epoch"]["context"]["target"]
                    if target != 0:
                        data["result"] = scores[target:] + scores[0:target]
                        self.o.data.at[timestamp, "data"] = json.dumps(data)
        else:
            self.o.data = None
