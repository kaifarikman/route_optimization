import json
import subprocess
from pathlib import Path


def test_savings_estimate_uses_positive_distance_time_and_coefficients():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/features/savings-estimate.js").as_uri()
    script = f"""
        import {{ estimateSavings }} from {json.dumps(module_url)};
        const result = estimateSavings(
            {{ distanceSaved: 12.5, timeSaved: 18 }},
            {{ rubPerKm: "35", rubPerMinute: "8" }},
        );
        console.log(JSON.stringify(result));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    parsed = json.loads(result.stdout)
    assert parsed == {
        "distanceSavedKm": 12.5,
        "timeSavedMinutes": 18,
        "rubPerKm": 35,
        "rubPerMinute": 8,
        "rubles": 581.5,
    }


def test_savings_estimate_treats_empty_invalid_and_negative_coefficients_as_zero():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/features/savings-estimate.js").as_uri()
    script = f"""
        import {{ estimateSavings }} from {json.dumps(module_url)};
        const result = estimateSavings(
            {{ distanceSaved: 4, timeSaved: 10 }},
            {{ rubPerKm: "", rubPerMinute: "-12" }},
        );
        const invalid = estimateSavings(
            {{ distanceSaved: 4, timeSaved: 10 }},
            {{ rubPerKm: "abc", rubPerMinute: null }},
        );
        console.log(JSON.stringify({{ result, invalid }}));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    parsed = json.loads(result.stdout)
    assert parsed["result"]["rubles"] == 0
    assert parsed["result"]["rubPerKm"] == 0
    assert parsed["result"]["rubPerMinute"] == 0
    assert parsed["invalid"]["rubles"] == 0
    assert parsed["invalid"]["rubPerKm"] == 0
    assert parsed["invalid"]["rubPerMinute"] == 0


def test_savings_estimate_keeps_rubles_at_zero_when_route_is_worse():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/features/savings-estimate.js").as_uri()
    script = f"""
        import {{ estimateSavings }} from {json.dumps(module_url)};
        const result = estimateSavings(
            {{ distanceSaved: -3, timeSaved: -7 }},
            {{ rubPerKm: "35", rubPerMinute: "8" }},
        );
        console.log(JSON.stringify(result));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    parsed = json.loads(result.stdout)
    # Реальные изменения отдаём со знаком (для честного отображения),
    # но деньги никогда не уходят в минус.
    assert parsed["distanceSavedKm"] == -3
    assert parsed["timeSavedMinutes"] == -7
    assert parsed["rubles"] == 0
