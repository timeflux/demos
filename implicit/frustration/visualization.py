import pandas as pd
import numpy as np
from numpy import array, arccos
from numpy.linalg import norm
from math import degrees
import mne
import json
import matplotlib.pyplot as plt

fnames = [
    "exp_data/20220512-122156-Maryem-Ouihia.hdf5",
    "exp_data/20220512-142455-Gabin-Lembrez.hdf5",
]
snames = ["maryem", "gabin"]

tmin = -0.2
baseline = (None, None)
l_freq, h_freq = 0.1, 35

for fname, subject in zip(fnames, snames):
    store = pd.HDFStore(fname, "r")

    # for key in store.keys():
    #     print(key)

    events = store.select("events")
    steps = events.loc[events["label"] == "step"]
    onsets = steps.index.values.astype(np.int64) * 1e-9
    angles = []
    for l, d in zip(events.label, events.data):
        if l == "grid":
            d = json.loads(d)
            rows, target, cursor_curr = d["rows"], d["target"], d["cursor"]
            continue
        elif l == "step":
            cursor_prev, cursor_curr = cursor_curr, json.loads(d)["cursor"]
        else:
            continue

        get_x = lambda i: (i - 1) % rows
        get_y = lambda i: i // rows
        get_point = lambda i: array([get_x(i), get_y(i)])
        get_vec = lambda i, j: get_point(j) - get_point(i)
        get_ang = lambda i, j, k: degrees(
            arccos(
                (get_vec(i, j) @ get_vec(i, k))
                / (norm(get_vec(i, j)) * norm(get_vec(i, k)))
            )
        )

        theta = get_ang(cursor_prev, target, cursor_curr)
        angles.append(f"{theta:.0f}")
    annotations = mne.Annotations(onsets, 0, angles, orig_time=0)
    annotations

    signal = store.select("eeg")
    channels = list(signal.columns.values)
    times = signal.index.values.astype(np.int64) * 1e-9
    data = signal.values.T * 1e-6
    rate = store.get_node("eeg")._v_attrs["meta"]["rate"]
    info = mne.create_info(
        ch_names=channels, sfreq=rate, ch_types=4 * ["eeg"] + ["misc"]
    )
    info.set_montage("standard_1020")
    raw = mne.io.RawArray(data, info)
    raw._filenames = [
        fname
    ]  # Hotfix: see https://github.com/mne-tools/mne-python/issues/9385
    raw.set_meas_date(times[0])
    raw.set_annotations(annotations)

    raw.notch_filter(50, method="iir")
    raw.filter(l_freq, h_freq, method="iir")
    events, event_id = mne.events_from_annotations(raw)
    epochs = mne.Epochs(
        raw,
        events=events,
        event_id=event_id,
        tmin=tmin,
        tmax=0.5,
        baseline=baseline,
        reject=None,
        preload=True,
        verbose=False,
    )
    print(f"Dropped: ", (1 - len(epochs.events) / len(events)) * 100, "%")
    epochs_orig = epochs.copy()

    partition = {"0-10": [], "10-45": [], "45-90": [], "90-135": [], "135-180": []}
    for ei in epochs.event_id:
        if 0 <= int(ei) <= 10 and ei not in partition["0-10"]:
            partition["0-10"].append(ei)
        elif 10 < int(ei) <= 45 and ei not in partition["10-45"]:
            partition["10-45"].append(ei)
        elif 45 < int(ei) <= 90 and ei not in partition["45-90"]:
            partition["45-90"].append(ei)
        elif 90 < int(ei) <= 135 and ei not in partition["90-135"]:
            partition["90-135"].append(ei)
        elif 135 < int(ei) <= 180 and ei not in partition["135-180"]:
            partition["135-180"].append(ei)
    old_event_ids = [
        partition["0-10"],
        partition["10-45"],
        partition["45-90"],
        partition["90-135"],
        partition["135-180"],
    ]
    new_event_id = [{"<0": 20}, {"<45": 21}, {"<90": 22}, {"<135": 23}, {"<180": 24}]
    for old, new in zip(old_event_ids, new_event_id):
        epochs = mne.epochs.combine_event_ids(epochs, old, new)

    evokeds = {
        "dir_0": epochs["<0"].average(),
        "dir_45": epochs["<45"].average(),
        "dir_90": epochs["<90"].average(),
        "dir_135": epochs["<135"].average(),
        "dir_180": epochs["<180"].average(),
    }
    for elec in ["AF7", "AF8", "TP9", "TP10"]:
        nave = ", ".join([str(e.nave) for e in evokeds.values()])
        mne.viz.plot_compare_evokeds(
            evokeds,
            picks=[elec],
            cmap="viridis",
            title=f"{elec} - nave: {nave}",
            show=False,
        )
        plt.savefig(f"{subject}-{elec}.png")
        plt.close()

    epochs = epochs_orig.copy()
    partition = {"0-60": [], "60-120": [], "120-180": []}
    for ei in epochs.event_id:
        if 0 <= int(ei) <= 60 and ei not in partition["0-60"]:
            partition["0-60"].append(ei)
        elif 60 < int(ei) <= 120 and ei not in partition["60-120"]:
            partition["60-120"].append(ei)
        elif 120 < int(ei) <= 180 and ei not in partition["120-180"]:
            partition["120-180"].append(ei)
    old_event_ids = [partition["0-60"], partition["60-120"], partition["120-180"]]
    new_event_id = [{"<60": 20}, {"<120": 21}, {"<180": 22}]
    for old, new in zip(old_event_ids, new_event_id):
        epochs = mne.epochs.combine_event_ids(epochs, old, new)

    evokeds = {
        "dir_60": epochs["<60"].average(),
        "dir_120": epochs["<120"].average(),
        "dir_180": epochs["<180"].average(),
    }
    for elec in ["AF7", "AF8", "TP9", "TP10"]:
        nave = ", ".join([str(e.nave) for e in evokeds.values()])
        mne.viz.plot_compare_evokeds(
            evokeds,
            picks=[elec],
            cmap="viridis",
            title=f"{elec} - nave: {nave}",
            show=False,
        )
        plt.savefig(f"{subject}-{elec}-alt.png")
        plt.close()

    elecs = ["AF7", "AF8", "TP9", "TP10"]
    for evo in eovkeds:
        fig = mne.viz.plot_epochs_image(epochs[evo], vmin=0, vmax=20, show=False)
        fig[0].savefig(f"{subject}-{evo}-erp-gfp.png")
        fig = mne.viz.plot_epochs_image(
            epochs[evo], vmin=-10, vmax=10, show=False, picks=elecs, combine=None
        )
        for e, f in zip(elecs, fig):
            f.savefig(f"{subject}-{evo}-{e}-erp-.png")
    plt.close("all")

    epochs.pick_types(eeg=True)
    xd = mne.preprocessing.Xdawn(n_components=2, reg="ledoit_wolf")
    y = [1 if e == 20 else 0 for e in epochs["<60", "<120"].events[:, 2]]
    xd.fit(epochs["<60", "<120"], y)
    ep_xd = xd.apply(epochs)
    elecs = ["AF7", "AF8", "TP9", "TP10"]
    for evo in ["<60", "<120"]:
        fig = mne.viz.plot_epochs_image(ep_xd[evo], vmin=0, vmax=20, show=False)
        fig[0].savefig(f"{subject}-{evo}-xdawn-erp-gfp.png")
        fig = mne.viz.plot_epochs_image(
            epochs[evo], vmin=-10, vmax=10, show=False, picks=elecs, combine=None
        )
        for e, f in zip(elecs, fig):
            f.savefig(f"{subject}-{evo}-xdawn-erp-{e}.png")
    plt.close("all")
