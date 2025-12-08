# backend/tests/test_pagination.py

import pytest
from app.core.pagination import PaginationParams, create_paginated_response


def test_pagination_params():
    """Test pagination parameters"""
    params = PaginationParams(page=2, limit=10)
    assert params.offset == 10
    assert params.skip == 10
    assert params.page == 2
    assert params.limit == 10


def test_create_paginated_response():
    """Test creating paginated response"""
    items = [1, 2, 3, 4, 5]
    total = 25
    pagination = PaginationParams(page=1, limit=5)
    
    response = create_paginated_response(items, total, pagination)
    
    assert response.items == items
    assert response.total == 25
    assert response.page == 1
    assert response.limit == 5
    assert response.pages == 5  # 25 / 5 = 5 pages
    assert response.has_next is True
    assert response.has_prev is False


def test_paginated_response_last_page():
    """Test paginated response on last page"""
    items = [21, 22, 23, 24, 25]
    total = 25
    pagination = PaginationParams(page=5, limit=5)
    
    response = create_paginated_response(items, total, pagination)
    
    assert response.has_next is False
    assert response.has_prev is True

