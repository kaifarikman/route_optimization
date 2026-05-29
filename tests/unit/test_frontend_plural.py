import json
import subprocess
from pathlib import Path


def test_generated_points_message_uses_russian_plural_forms():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/utils/plural.js").as_uri()
    script = f"""
        import {{ generatedPointsMessage }} from {json.dumps(module_url)};
        const counts = [1, 2, 5, 11, 21, 22, 25];
        console.log(JSON.stringify(counts.map((count) => generatedPointsMessage(count))));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    assert json.loads(result.stdout) == [
        "Сгенерирована 1 точка",
        "Сгенерированы 2 точки",
        "Сгенерировано 5 точек",
        "Сгенерировано 11 точек",
        "Сгенерирована 21 точка",
        "Сгенерированы 22 точки",
        "Сгенерировано 25 точек",
    ]
