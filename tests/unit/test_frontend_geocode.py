import json
import subprocess
from pathlib import Path


def test_geocode_result_formatting_and_metadata():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/features/geocode.js").as_uri()
    script = f"""
        globalThis.window = {{ APP_CONFIG: null }};
        globalThis.localStorage = {{ getItem() {{ return null; }}, setItem() {{}} }};
        const {{ geocodeResultLabel, geocodePointMetadata }} = await import({json.dumps(module_url)});
        const result = {{
            lat: 55.75393,
            lon: 37.6208,
            display_name: "Красная площадь, Москва, Россия",
            provider: "nominatim",
            place_id: "123",
        }};
        console.log(JSON.stringify({{
            label: geocodeResultLabel(result),
            metadata: geocodePointMetadata(result),
            manualMetadata: geocodePointMetadata(result, "  Красная площадь  "),
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
        "label": "Красная площадь, Москва, Россия",
        "metadata": {
            "address": "Красная площадь, Москва, Россия",
            "geocoding_provider": "nominatim",
            "geocoding_place_id": "123",
        },
        "manualMetadata": {
            "address": "Красная площадь",
            "geocoding_provider": "nominatim",
            "geocoding_place_id": "123",
        },
    }


def test_route_order_label_renders_coordinates_with_optional_address():
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/ui/metrics.js").as_uri()
    script = f"""
        const {{ pointCoordinateLabel, pointAddressLabel, pointOrderLabelHtml }} = await import({json.dumps(module_url)});
        console.log(JSON.stringify({{
            coord: pointCoordinateLabel({{ lat: 55.75393, lon: 37.6208, address: "Красная площадь" }}),
            address: pointAddressLabel({{ lat: 55.75393, lon: 37.6208, address: "Красная площадь" }}),
            htmlWithAddress: pointOrderLabelHtml({{ lat: 55.75393, lon: 37.6208, address: "Красная площадь" }}),
            htmlWithoutAddress: pointOrderLabelHtml({{ lat: 55.75393, lon: 37.6208 }}),
        }}));
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )

    parsed = json.loads(result.stdout)
    assert parsed["coord"] == "55.7539, 37.6208"
    assert parsed["address"] == "Красная площадь"
    assert parsed["htmlWithAddress"] == (
        '<div class="order-coordinates">55.7539, 37.6208</div>'
        '<div class="order-address">Красная площадь</div>'
    )
    assert parsed["htmlWithoutAddress"] == (
        '<div class="order-coordinates">55.7539, 37.6208</div>'
    )
