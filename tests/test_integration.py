"""Integration tests: full run_all pipeline end-to-end."""
import pytest


@pytest.mark.live
@pytest.mark.timeout(120)
def test_run_all_populates_all_core_metrics(tmp_db):
    """After run_all, all 5 core metrics must have at least one DB row."""
    import run_all
    import base

    run_all.run()

    core_metrics = [
        "usd_vnd_sell",
        "usd_vnd_buy",
        "gold_sjc_sell_vnd",
        "gold_sjc_buy_vnd",
        "vn_index_close",
    ]
    missing = []
    for metric in core_metrics:
        rows = base.get_latest(metric, 1)
        if not rows:
            missing.append(metric)

    assert not missing, f"Missing data for metrics after run_all: {missing}"


@pytest.mark.live
@pytest.mark.timeout(120)
def test_run_all_values_are_positive(tmp_db):
    """All scraped values must be positive numbers."""
    import run_all, base

    run_all.run()

    metrics = ["usd_vnd_sell", "gold_sjc_sell_vnd", "vn_index_close"]
    for metric in metrics:
        rows = base.get_latest(metric, 1)
        if rows:
            assert rows[0]["value"] > 0, f"{metric} has non-positive value: {rows[0]['value']}"


@pytest.mark.live
@pytest.mark.timeout(120)
def test_run_all_is_idempotent(tmp_db):
    """Running twice produces same number of rows (upsert, not append)."""
    import run_all, base

    run_all.run()
    count_after_first = len(base.get_latest("usd_vnd_sell", 100))

    run_all.run()
    count_after_second = len(base.get_latest("usd_vnd_sell", 100))

    assert count_after_first == count_after_second, \
        "Second run created extra rows — upsert is broken"
