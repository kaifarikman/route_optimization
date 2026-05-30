import json
import subprocess
from pathlib import Path


def run_routes_script(script_body):
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/map/routes.js").as_uri()
    script = f"""
        const {{ drawRoute, clearRoute }} = await import({json.dumps(module_url)});

        function makeMap() {{
            return {{
                sources: {{}},
                layers: {{}},
                removedLayers: [],
                removedSources: [],
                getStyle() {{ return {{}}; }},
                isStyleLoaded() {{ return true; }},
                once() {{}},
                getSource(id) {{ return this.sources[id] || null; }},
                addSource(id, source) {{
                    this.sources[id] = {{
                        ...source,
                        setData(data) {{ this.data = data; }},
                    }};
                }},
                getLayer(id) {{ return this.layers[id] || null; }},
                addLayer(layer) {{ this.layers[layer.id] = layer; }},
                setPaintProperty(id, name, value) {{
                    this.layers[id].paint[name] = value;
                }},
                removeLayer(id) {{
                    delete this.layers[id];
                    this.removedLayers.push(id);
                }},
                removeSource(id) {{
                    delete this.sources[id];
                    this.removedSources.push(id);
                }},
            }};
        }}

        {script_body}
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def test_draw_route_creates_independent_base_and_optimized_layers():
    parsed = run_routes_script(
        """
        const map = makeMap();
        const route = {
            geometry: [[55.75, 37.61], [55.76, 37.62]],
            geometry_type: "full",
            is_fallback: false,
        };

        drawRoute(map, route, { kind: "base" });
        drawRoute(map, route, { kind: "optimized" });

        console.log(JSON.stringify({
            sources: Object.keys(map.sources).sort(),
            layers: Object.keys(map.layers).sort(),
            baseColor: map.layers["base-route-line"].paint["line-color"],
            optimizedColor: map.layers["optimized-route-line"].paint["line-color"],
            baseOffset: map.layers["base-route-line"].paint["line-offset"],
            optimizedOffset: map.layers["optimized-route-line"].paint["line-offset"],
        }));
        """
    )

    assert parsed == {
        "sources": ["base-route", "optimized-route"],
        "layers": ["base-route-line", "optimized-route-line"],
        "baseColor": "#3388ff",
        "optimizedColor": "#4CAF50",
        "baseOffset": -3,
        "optimizedOffset": 3,
    }


def test_clear_route_removes_both_route_layers_and_sources_by_default():
    parsed = run_routes_script(
        """
        const map = makeMap();
        const route = {
            geometry: [[55.75, 37.61], [55.76, 37.62]],
            geometry_type: "full",
            is_fallback: false,
        };

        drawRoute(map, route, { kind: "base" });
        drawRoute(map, route, { kind: "optimized" });
        clearRoute(map);

        console.log(JSON.stringify({
            sources: Object.keys(map.sources),
            layers: Object.keys(map.layers),
            removedLayers: map.removedLayers.sort(),
            removedSources: map.removedSources.sort(),
        }));
        """
    )

    assert parsed == {
        "sources": [],
        "layers": [],
        "removedLayers": ["base-route-line", "optimized-route-line"],
        "removedSources": ["base-route", "optimized-route"],
    }


def test_fallback_route_keeps_dashed_line_style():
    parsed = run_routes_script(
        """
        const map = makeMap();
        const route = {
            coordinates: [[55.75, 37.61], [55.76, 37.62]],
            geometry_type: "straight",
            is_fallback: true,
        };

        drawRoute(map, route, { kind: "optimized" });

        console.log(JSON.stringify({
            dash: map.layers["optimized-route-line"].paint["line-dasharray"],
            coordinates: map.sources["optimized-route"].data.geometry.coordinates,
        }));
        """
    )

    assert parsed == {
        "dash": [1.4, 1.4],
        "coordinates": [[37.61, 55.75], [37.62, 55.76]],
    }
