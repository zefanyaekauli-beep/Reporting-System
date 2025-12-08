# backend/app/core/pagination.py

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel
from fastapi import Query

T = TypeVar("T")

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = 1
    limit: int = 20
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit
    
    @property
    def skip(self) -> int:
        return self.offset


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model"""
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    
    @property
    def has_next(self) -> bool:
        return self.page < self.pages
    
    @property
    def has_prev(self) -> bool:
        return self.page > 1


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
) -> PaginationParams:
    """Get pagination parameters from query"""
    return PaginationParams(page=page, limit=limit)


def paginate_query(query, pagination: PaginationParams):
    """Apply pagination to SQLAlchemy query"""
    return query.offset(pagination.offset).limit(pagination.limit)


def create_paginated_response(
    items: List[T],
    total: int,
    pagination: PaginationParams,
) -> PaginatedResponse[T]:
    """Create paginated response"""
    pages = (total + pagination.limit - 1) // pagination.limit  # Ceiling division
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages,
    )
