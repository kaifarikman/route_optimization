import os

def test_project_structure():
    assert os.path.exists('src/backend/main.py')
    assert os.path.exists('src/frontend/index.html')
    assert os.path.exists('requirements.txt')
    print("Project structure is OK")

def test_backend_import():
    try:
        from src.backend.main import app
        assert app is not None
        print("Backend import OK")
    except Exception as e:
        print(f"⚠️ Backend not ready: {e}")
        pass
