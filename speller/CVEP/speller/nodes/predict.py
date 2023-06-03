import json
import numpy as np
from timeflux.core.node import Node
from timeflux.helpers.port import make_event

from time import time


class Accumulate(Node):
    """ Accumulation of probabilities

    This node accumulates the probabilities of single-trial classifications from a ML node.
    When enough confidence is reached for a specific class, a final prediction is made.
    Confidence can be defined by a fixed probability value, a number of iterations or the ratio between the two best candidates.
    Optionnaly, a recovery period can be applied for all classes or a specific set of classes. This is useful to discard stale epochs.

    Attributes:
        i_model (Port): Single-trial predictions from the ML node, expects DataFrame.
        i_reset (Port): Reset events for updating arguments, expects DataFrame.
        o_events (Port): Final predictions and optional feedback, provides DataFrame

    Args:
        accumulation (string): Accumulation method: 'sum' for mean or 'prod' for bayesian (default: 'prod').
        scoring (string): Scoring method: 'ratio', 'highest' or 'iteration' (default: 'ratio').
        threshold (float): Score to reach to emit a prediction (default: 2).
        min_buffer_size (int): Minimum number of predictions to accumulate emitting a prediction (default: 0).
        max_buffer_size (int): Maximum number of predictions to accumulate for each class (default: 30).
        recovery (int): Minumum duration in ms required between two consecutive epochs after a prediction. Useful to avoid classifying the same event twice (default: 200).
        feedback (bool): If True, continuous feedback events will be sent (default: False).
        classes (list): If not None, apply the recovery period only for the specified classes. Useful for resting state classification (default: None).
        source (string): An optional unique identifier used to differentiate predictions from multiple models.
    """

    def __init__(self, accumulation="bayesian", scoring="ratio", threshold=2, min_buffer_size=0, max_buffer_size=30, recovery=200, feedback=False, classes=None, source=""):
        self.accumulation = accumulation
        self.scoring = scoring
        self.threshold = threshold
        self.min_buffer_size = min_buffer_size
        self.max_buffer_size = max_buffer_size
        self.recovery = recovery
        self.feedback = feedback
        self.classes = classes
        self.source = source
        self._buffer = []
        self._iterations = 0
        self._recovery = False

    def update(self):

        # Loop through the reset events
        if self.i_reset.ready():
            for timestamp, row in self.i_reset.data.iterrows():
                if row.label == f"reset_{self.source}_accumulation":
                    self.logger.debug(f"SET: {row['data']}")
                    self._reset(json.loads(row["data"]))
                if row.label == f"get_{self.source}_accumulation":
                    meta = {"accumulation": self.accumulation, "scoring": self.scoring, "threshold": self.threshold,  "min_buffer_size": self.min_buffer_size, "max_buffer_size": self.max_buffer_size, "recovery": self.recovery, "source": self.source}
                    self.logger.debug(f"GET: {meta}")
                    self.o.data = make_event(f"accumulation", meta, False)

        # Loop through the model events
        if self.i_model.ready():
            # Get an iterator over epochs, if any
            if "epochs" in self.i_model.meta:
                epochs = iter(self.i_model.meta["epochs"])
            else:
                epochs = None
            for timestamp, row in self.i_model.data.iterrows():
                # Check if the model is fitted and forward the event
                if row.label == "ready":
                    self.o.data = make_event("ready", False)
                    return
                # Check probabilities
                elif row.label == "predict_proba":
                    # Use the epoch timestamp if available, otherwise use the event timestamp
                    if epochs:
                        onset = next(epochs)["epoch"]["onset"]
                        timestamp = onset.value / 1e6
                    else:
                        timestamp = timestamp.value / 1e6
                    # Ignore stale epochs
                    if self._recovery:
                        # FIXME: will work only for epochs, not windows
                        if (timestamp - self._recovery) > self.recovery:
                            self._recovery = False
                        else:
                            self._recovery = timestamp
                            continue
                    # Append to buffer
                    proba = json.loads(row["data"])["result"]
                    self._buffer.append(proba)
                    if len(self._buffer) > self.max_buffer_size:
                        self._buffer.pop(0)
                    self._iterations += 1
                    # Accumulate
                    scores = getattr(self, f"_accumulation_{self.accumulation}")()
                    # Scale
                    scores /= scores.sum()
                    # Send continuous feedback
                    if self.feedback:
                        meta = {"scores": list(scores), "source": self.source}
                        self.o.data = make_event("feedback", meta, False)
                    # Wait for enough data
                    if len(self._buffer) < self.min_buffer_size:
                        continue
                    # Score
                    if len(scores) < 2:
                        self.logger.warn("At least two classes are required for scoring.")
                        continue
                    score = getattr(self, f"_scoring_{self.scoring}")(scores)
                    if score >= self.threshold:
                        # Make a final decision and reset the buffer
                        target = int(scores.argmax())
                        meta = {"timestamp": timestamp, "target": target, "score": score, "accumulation": list(scores), "iterations": self._iterations, "source": self.source}
                        self.o.data = make_event("predict", meta, False)
                        self.logger.debug(meta)
                        self._buffer = []
                        self._iterations = 0
                        if self.classes is None or indices[0] in self.classes:
                            self._recovery = timestamp

    def _reset(self, settings):
        if settings.get("accumulation"): self.accumulation = settings["accumulation"]
        if settings.get("scoring"): self.scoring = settings["scoring"]
        if settings.get("threshold"): self.threshold = settings["threshold"]
        if settings.get("min_buffer_size"): self.min_buffer_size = settings["min_buffer_size"]
        if settings.get("max_buffer_size"): self.max_buffer_size = settings["max_buffer_size"]
        if settings.get("recovery"): self.recovery = settings["recovery"]
        if settings.get("feedback") != None: self.feedback = settings["feedback"]
        self._buffer = []
        self._iterations = 0

    def _accumulation_mean(self):
        """ Sum the probabilities together.
            After scaling, this is equivalent to averaging the epochs.
        """
        return np.sum(np.array(self._buffer), axis=0)

    def _accumulation_bayesian(self):
        """ Multiply the probabilities together.
        """
        return np.prod(np.array(self._buffer), axis=0)

    def _scoring_ratio(self, scores):
        indices = np.flip(np.argsort(scores))
        return scores[indices[0]] / scores[indices[1]]

    def _scoring_highest(self, scores):
        indices = np.flip(np.argsort(scores))
        return scores[indices[0]]

    def _scoring_iteration(self, scores):
        return self._iterations
