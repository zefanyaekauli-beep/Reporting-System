# backend/tests/test_health.py

import pytest
from fastapi import status


def test_health_endpoint(client):
    """Test basic health endpoint"""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_detailed_health_endpoint(client):
    """Test detailed health endpoint"""
    response = client.get("/health/detailed")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "services" in data
    assert "database" in data["services"]
    assert "disk" in data["services"]

