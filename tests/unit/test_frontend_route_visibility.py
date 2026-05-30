import json
import subprocess
from pathlib import Path


def run_visibility_script(script_body):
    module_url = (Path(__file__).resolve().parents[2] / "frontend/js/map/route-visibility.js").as_uri()
    script = f"""
        const {{
            activeVisibleRoute,
            nextRouteToggleState,
            routeVisibilityState,
        }} = await import({json.dumps(module_url)});

        {script_body}
    """

    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def test_route_visibility_defaults_to_no_visible_routes():
    parsed = run_visibility_script(
        """
        const state = {
            baseRoute: { id: 1 },
            optimizedRoute: { id: 2 },
            selectedRouteMode: "base",
        };
        const active = activeVisibleRoute(state);
        console.log(JSON.stringify({
            visibility: routeVisibilityState(state.routeVisibility),
            activeMode: active.mode,
            activeRoute: active.route,
        }));
        """
    )

    assert parsed == {
        "visibility": {"base": False, "optimized": False},
        "activeMode": None,
        "activeRoute": None,
    }


def test_route_toggle_state_selects_visible_route_and_allows_both_off():
    parsed = run_visibility_script(
        """
        const baseRoute = { id: 1 };
        const optimizedRoute = { id: 2 };
        let state = {
            baseRoute,
            optimizedRoute,
            routeVisibility: { base: false, optimized: false },
            selectedRouteMode: "base",
        };

        const baseOn = nextRouteToggleState(state, "base");
        state = { ...state, ...baseOn };
        const optimizedOn = nextRouteToggleState(state, "optimized");
        state = { ...state, ...optimizedOn };
        const optimizedOff = nextRouteToggleState(state, "optimized");
        state = { ...state, ...optimizedOff };
        const baseOff = nextRouteToggleState(state, "base");
        state = { ...state, ...baseOff };

        console.log(JSON.stringify({
            baseOn,
            optimizedOn,
            optimizedOff,
            baseOff,
            finalActive: activeVisibleRoute(state),
        }));
        """
    )

    assert parsed["baseOn"] == {
        "routeVisibility": {"base": True, "optimized": False},
        "selectedRouteMode": "base",
    }
    assert parsed["optimizedOn"] == {
        "routeVisibility": {"base": True, "optimized": True},
        "selectedRouteMode": "optimized",
    }
    assert parsed["optimizedOff"] == {
        "routeVisibility": {"base": True, "optimized": False},
        "selectedRouteMode": "base",
    }
    assert parsed["baseOff"] == {
        "routeVisibility": {"base": False, "optimized": False},
    }
    assert parsed["finalActive"]["mode"] is None
    assert parsed["finalActive"]["route"] is None


def test_active_visible_route_supports_base_only_optimized_only_and_both():
    parsed = run_visibility_script(
        """
        const baseRoute = { id: 1 };
        const optimizedRoute = { id: 2 };
        const baseOnly = activeVisibleRoute({
            baseRoute,
            optimizedRoute,
            routeVisibility: { base: true, optimized: false },
            selectedRouteMode: "optimized",
        });
        const optimizedOnly = activeVisibleRoute({
            baseRoute,
            optimizedRoute,
            routeVisibility: { base: false, optimized: true },
            selectedRouteMode: "base",
        });
        const both = activeVisibleRoute({
            baseRoute,
            optimizedRoute,
            routeVisibility: { base: true, optimized: true },
            selectedRouteMode: "optimized",
        });

        console.log(JSON.stringify({
            baseOnly: { mode: baseOnly.mode, id: baseOnly.route.id },
            optimizedOnly: { mode: optimizedOnly.mode, id: optimizedOnly.route.id },
            both: { mode: both.mode, id: both.route.id },
        }));
        """
    )

    assert parsed == {
        "baseOnly": {"mode": "base", "id": 1},
        "optimizedOnly": {"mode": "optimized", "id": 2},
        "both": {"mode": "optimized", "id": 2},
    }
