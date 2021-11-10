import os
import pandas as pd

# Ignore the "object name is not a valid Python identifier" message
import warnings
from tables.exceptions import NaturalNameWarning
warnings.simplefilter("ignore", NaturalNameWarning)

# Settings
THRESHOLD = 562500
CHANNEL = "sync"
GROUP = "/eeg/"

def sync(input, output=None):

    # Check files
    if not os.path.exists(input):
        exit("The input file does not exist.")
    if not output:
        name, extension = os.path.splitext(input)
        output = f"{name}-sync{extension}"
    if os.path.exists(output):
        print("The output file will be overwritten.")
        os.remove(output)

    # Get data keys and meta from input file
    nodes = []
    store = pd.HDFStore(input, "r")
    for key in store.keys():
        node = {
            "name": key,
            "meta": {}
        }
        if store.get_node(key)._v_attrs.__contains__("meta"):
            node["meta"] = store.get_node(key)._v_attrs["meta"]
        nodes.append(node)
    store.close()

    # Copy data
    for node in nodes:
        df = pd.read_hdf(input, node["name"])
        if node["name"].startswith(GROUP):
            # Get onset and trim
            start = df.loc[df[CHANNEL] == THRESHOLD].index[0]
            print(f"{node['name']}\t{start}")
            df = df[start:]
        df.to_hdf(output, node["name"], "a", complevel=3, format="table")

    # Copy meta
    store = pd.HDFStore(output, "a")
    for node in nodes:
        store.get_node(node["name"])._v_attrs["meta"] = node["meta"]
    store.close()


if __name__ == "__main__":
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument("input", help="input path")
    parser.add_argument("-o", "--output", default=None, help="output path")
    args = parser.parse_args()
    sync(args.input, args.output)
