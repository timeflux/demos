import os
import logging
from scipy.signal import max_len_seq
from numpy.random import randint, seed

logger = logging.getLogger("timeflux")

# Generate m-sequence
nbits = os.getenv("NBITS")
if nbits:
	nbits = int(nbits)
	if os.getenv("SEED"):
		seed(int(os.getenv("SEED")))        # for reproducibility
	state = randint(2, size=nbits)          # seed
	seq_arr = max_len_seq(nbits, state)[0]  # m-sequence as an array
	seq_str = "".join(map(str, seq_arr))    # m-sequence as a string
	os.environ["PATTERN"] = seq_str

# Compute epoch length
length = round(len(os.getenv("PATTERN")) / int(os.getenv("RATE", 60)), 3)
os.environ["EPOCH_LENGTH"] = str(length)

# Show some info
logger.debug(f"m-sequence: {os.getenv('PATTERN')}, step: {os.getenv('STEP')}, duration: {length}s")
