import numpy as np
import pandas as pd
import pytest
from nodes.rereference import Mean

def test_rereference():
    node = Mean()
    np.random.seed(42)
    node.i.data = pd.DataFrame(np.random.rand(2,3))
    node.update()
    expected = np.array([[-0.31120934, 0.26496485,0.04624449], [0.29510127, -0.14753857, -0.14756269]])
    np.testing.assert_allclose(node.o.data.values, expected)