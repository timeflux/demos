import numpy as np
import pandas as pd
import pytest
from nodes.predict import Accumulate

def test_accumulation_mean():
    node = Accumulate()
    node._buffer = [[1, 2, 3], [4, 5, 6]]
    result = node._accumulation_mean()
    expected = [5, 7, 9]
    np.testing.assert_array_equal(result, expected)

def test_accumulation_bayesian():
    node = Accumulate()
    node._buffer = [[1, 2, 3], [4, 5, 6]]
    result = node._accumulation_bayesian()
    expected = [4, 10, 18]
    np.testing.assert_array_equal(result, expected)

def test_scoring_ratio():
    node = Accumulate()
    scores = np.array([1, 3, 2])
    result = node._scoring_ratio(scores)
    expected = 1.5
    assert result == expected

def test_scoring_highest():
    node = Accumulate()
    scores = np.array([1, 3, 2])
    result = node._scoring_highest(scores)
    expected = 3
    assert result == expected

def test_scoring_iteration():
    node = Accumulate()
    node._iterations = 42
    result = node._scoring_iteration(None)
    expected = 42
    assert result == expected