import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.cross_decomposition import CCA

class CVEP_CCA(BaseEstimator, ClassifierMixin):

    def __init__(self, n_classes=None, offset=None):
        self._cca = CCA(n_components=1, max_iter=1000)
        self._templates = {}
        self.n_classes=n_classes
        self.offset=offset
    
    def fit(self, X, y, sample_weight=None):
        
        trained = np.unique(y)
        
        # Mean of trained sequences
        for template_id in trained:
            indices = np.where(y == template_id)            
            self._templates[template_id] = X[indices].mean(axis=0)
            
        # Mean of shifted trained sequences
        if self.n_classes and self.offset:
            for i in [x for x in range(self.n_classes) if x not in trained]:
                templates = []
                for template_id in trained:
                    offset = (i - template_id) * self.offset
                    template = np.concatenate((self._templates[template_id][:, offset:], self._templates[template_id][:, :offset]), axis=1)
                    templates.append(template)
                self._templates[i] = np.array(templates).mean(axis=0)
                
        return self    
    
    def predict(self, X):
        y = []
        for x in X:
            correlations = {}            
            for template_id in self._templates:                            
                x_score, y_score = self._cca.fit_transform(x.T, self._templates[template_id].T)
                correlations[template_id] = np.corrcoef(x_score.T, y_score.T)[0, 1]
            y.append(max(correlations, key=lambda k: correlations[k]))
        return y   
    
    def predict_proba(self, X):
        P = np.zeros(shape=(len(X), len(self._templates)))
        for i, x in enumerate(X):
            for j, template_id in enumerate(self._templates):
                x_score, y_score = self._cca.fit_transform(x.T, self._templates[template_id].T)
                P[i, j] = np.corrcoef(x_score.T, y_score.T)[0, 1]
        return P / np.resize(P.sum(axis=1), P.T.shape).T