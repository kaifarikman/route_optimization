import json
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlparse


def get_map_styles():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/map/map.js").as_uri()
    script = f"""
        globalThis.window = {{ APP_CONFIG: {{}} }};
        const {{ DEFAULT_MAP_STYLE, MAP_STYLES }} = await import({json.dumps(module_url)});
        console.log(JSON.stringify({{
            defaultStyle: DEFAULT_MAP_STYLE,
            styles: MAP_STYLES,
        }}));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def test_map_style_config_uses_openfreemap_light_and_dark_styles():
    parsed = get_map_styles()

    assert parsed["defaultStyle"] == "streets"
    assert parsed["styles"]["streets"]["url"] == "https://tiles.openfreemap.org/styles/liberty"
    assert parsed["styles"]["dark"]["url"] == "https://tiles.openfreemap.org/styles/dark"


def test_map_style_config_has_no_mapbox_or_tokenized_provider_urls():
    parsed = get_map_styles()

    for style in parsed["styles"].values():
        url = style["url"]
        query = parse_qs(urlparse(url).query)

        assert url.startswith("https://tiles.openfreemap.org/styles/")
        assert "api.mapbox.com" not in url
        assert "mapbox" not in url.lower()
        assert "access_token" not in query
        assert "key" not in query
        assert "token" not in query
