import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_array

class EMGFeatures(BaseEstimator, TransformerMixin):
    """EMG Temporal features"""
    def fit(self, X, y=None):
        """"""
        return self

    def transform(self, X):
        """Extract EMG temporal features
        Parameters
        ----------
        X : ndarray, shape (n_trials, n_samples, n_channels)
            Data to extract features from
        Returns
        -------
        features : ndarray, shape (n_trials, n_features)
            Temporal features
        """
        X = check_array(X, allow_nd=True)
        shapeX = X.shape

        if len(shapeX) == 3:
            Nt, Ns, Ne = shapeX
        else:
            raise ValueError("X.shape should be (n_trials, n_samples, n_electrodes).")
        
        features = np.hstack([np.max(X, axis=1), np.std(X, axis=1), np.apply_along_axis(self._zero_crossing_rate, 1, X)])
        return features

    def fit_transform(self, X, y=None):
        """
        Parameters
        ----------
        X : ndarray, shape (n_trials,  n_samples, n_channels)
            Data to extract features from
        y : ndarray, shape (n_trials,) | None, optional
            labels corresponding to each trial, not used (mentioned for sklearn comp)
        Returns
        -------
        X : ndarray, shape (n_trials, n_features)
            Temporal features
        """
        self.fit(X, y)
        return self.transform(X)
    
    @staticmethod
    def _zero_crossing_rate(x):
        return len(np.where(np.diff(np.sign(x)))[0]) / len(x)
