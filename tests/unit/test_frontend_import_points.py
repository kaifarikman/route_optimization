import json
import subprocess
from pathlib import Path


def test_import_parser_reports_invalid_and_limit_counts():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/features/import-points.js").as_uri()
    rows = ["lat,lon", "55.75,37.62", "91,37.62", "80,150"]
    rows.extend(f"55.{index},37.{index}" for index in range(51))
    script = f"""
        globalThis.window = {{ APP_CONFIG: null }};
        globalThis.localStorage = {{ getItem() {{ return null; }}, setItem() {{}} }};
        const {{ parseFilePoints, importSummary }} = await import({json.dumps(module_url)});
        const parsed = parseFilePoints({json.dumps(chr(10).join(rows))}, "points.csv");
        const imported = parsed.validPoints.slice(0, 50);
        console.log(JSON.stringify({{
            totalRows: parsed.totalRows,
            validCount: parsed.validPoints.length,
            skippedInvalid: parsed.skippedInvalid,
            skippedByLimit: Math.max(parsed.validPoints.length - 50, 0),
            summary: importSummary(imported.length, parsed.skippedInvalid, Math.max(parsed.validPoints.length - 50, 0)),
        }}));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    parsed = json.loads(result.stdout)
    assert parsed == {
        "totalRows": 54,
        "validCount": 53,
        "skippedInvalid": 1,
        "skippedByLimit": 3,
        "summary": "Импортировано 50 точек. Пропущено 1 невалидных. Ещё 3 сверх лимита 50.",
    }
