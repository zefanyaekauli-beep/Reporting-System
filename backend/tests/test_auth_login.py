"""
Test login endpoint to catch regressions.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app=app)

def test_login_wrong_password():
    """Test login with wrong password - should be 401, not 500"""
    res = client.post("/api/auth/login", json={
        "username": "supervisor",
        "password": "wrong-password"
    })
    # Should be 401 or 400, but NOT 500
    assert res.status_code != 500, f"Got 500 error: {res.json()}"
    assert res.status_code in [400, 401, 422], f"Unexpected status: {res.status_code}"

def test_login_invalid_user():
    """Test login with non-existent user - should be 401, not 500"""
    res = client.post("/api/auth/login", json={
        "username": "nonexistent_user_12345",
        "password": "anypassword"
    })
    # Should be 401 or 400, but NOT 500
    assert res.status_code != 500, f"Got 500 error: {res.json()}"
    assert res.status_code in [400, 401, 422], f"Unexpected status: {res.status_code}"

def test_login_success():
    """Test successful login - should return 200 with token"""
    res = client.post("/api/auth/login", json={
        "username": "supervisor",
        "password": "password123"
    })
    # Should be 200 with access_token
    if res.status_code == 500:
        print(f"❌ Got 500 error: {res.json()}")
        raise AssertionError(f"Login returned 500: {res.json()}")
    
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.json()}"
    data = res.json()
    assert "access_token" in data, f"Missing access_token in response: {data}"
    assert data["token_type"] == "bearer"
    assert "user" in data

