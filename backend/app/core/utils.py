# backend/app/core/utils.py

"""Utility functions to reduce code duplication"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from app.models.user import User
from app.models.site import Site


def build_date_filter(query, date_column, date_from: Optional[date] = None, date_to: Optional[date] = None):
    """Build date filter for queries"""
    if date_from:
        query = query.filter(date_column >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(date_column < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))
    return query


def build_search_filter(query, search: Optional[str], search_fields: List):
    """Build search filter for queries"""
    if search:
        conditions = [field.ilike(f"%{search}%") for field in search_fields]
        query = query.filter(or_(*conditions))
    return query


def batch_load_users_and_sites(
    db: Session,
    user_ids: List[int],
    site_ids: List[int],
) -> tuple[Dict[int, User], Dict[int, Site]]:
    """Batch load users and sites to avoid N+1 queries"""
    users = {}
    sites = {}
    
    if user_ids:
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    
    if site_ids:
        sites = {s.id: s for s in db.query(Site).filter(Site.id.in_(site_ids)).all()}
    
    return users, sites


def get_user_id_from_report(report) -> Optional[int]:
    """Extract user_id from report object (handles different field names)"""
    return getattr(report, 'user_id', None) or getattr(report, 'created_by', None)


def get_report_type_value(report_type) -> str:
    """Safely get report type value"""
    if isinstance(report_type, str):
        return report_type
    if hasattr(report_type, 'value'):
        return report_type.value
    return str(report_type)


def get_status_value(status) -> str:
    """Safely get status value"""
    if isinstance(status, str):
        return status
    if hasattr(status, 'value'):
        return status.value
    return str(status)

