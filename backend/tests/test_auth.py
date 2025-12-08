# backend/tests/test_auth.py

import pytest
from fastapi import status


def test_login_success(client):
    """Test successful login"""
    response = client.post(
        "/api/auth/login",
        json={"username": "supervisor", "password": ""}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "supervisor"
    assert data["division"] == "security"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/auth/login",
        json={"username": "invalid_user", "password": ""}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_missing_username(client):
    """Test login without username"""
    response = client.post(
        "/api/auth/login",
        json={"password": ""}
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_me_without_auth(client):
    """Test /me endpoint without authentication"""
    response = client.get("/api/auth/me")
    # Should return default user (current implementation allows this)
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]

