# backend/app/schemas/incident.py

"""
Incident Management Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime


# Base Incident Schema
class IncidentBaseSchema(BaseModel):
    id: int
    company_id: int
    site_id: int
    incident_type: str
    incident_number: str
    incident_date: date
    reported_by: int
    status: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# LK/LP Schemas
class LKLPReportCreate(BaseModel):
    site_id: int
    incident_date: date
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    police_report_number: Optional[str] = None
    police_station: Optional[str] = None
    perpetrator_name: Optional[str] = None
    perpetrator_details: Optional[str] = None
    witness_names: Optional[List[str]] = None
    damage_estimate: Optional[str] = None
    follow_up_required: bool = False


class LKLPReportOut(IncidentBaseSchema):
    police_report_number: Optional[str] = None
    police_station: Optional[str] = None
    perpetrator_name: Optional[str] = None
    perpetrator_details: Optional[str] = None
    witness_names: Optional[List[str]] = None
    damage_estimate: Optional[str] = None
    follow_up_required: bool = False


# BAP Schemas
class BAPReportCreate(BaseModel):
    site_id: int
    incident_date: date
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    investigation_date: Optional[date] = None
    investigator_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_id_number: Optional[str] = None
    investigation_findings: Optional[str] = None
    recommendations: Optional[str] = None
    related_incident_id: Optional[int] = None


class BAPReportOut(IncidentBaseSchema):
    investigation_date: Optional[date] = None
    investigator_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_id_number: Optional[str] = None
    investigation_findings: Optional[str] = None
    recommendations: Optional[str] = None
    related_incident_id: Optional[int] = None


# STPLK Schemas
class STPLKReportCreate(BaseModel):
    site_id: int
    incident_date: date
    title: str
    lost_item_description: str
    lost_item_value: Optional[str] = None
    lost_date: Optional[date] = None
    lost_location: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    police_report_number: Optional[str] = None
    description: Optional[str] = None


class STPLKReportUpdate(BaseModel):
    site_id: Optional[int] = None
    incident_date: Optional[date] = None
    title: Optional[str] = None
    lost_item_description: Optional[str] = None
    lost_item_value: Optional[str] = None
    lost_date: Optional[date] = None
    lost_location: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    police_report_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class STPLKReportOut(IncidentBaseSchema):
    lost_item_description: str
    lost_item_value: Optional[str] = None
    lost_date: Optional[date] = None
    lost_location: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    police_report_number: Optional[str] = None


# Findings Schemas
class FindingsReportCreate(BaseModel):
    site_id: int
    incident_date: date
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    finding_category: Optional[str] = None
    severity_level: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    responsible_party: Optional[str] = None
    due_date: Optional[date] = None


class FindingsReportUpdate(BaseModel):
    site_id: Optional[int] = None
    incident_date: Optional[date] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    finding_category: Optional[str] = None
    severity_level: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    responsible_party: Optional[str] = None
    due_date: Optional[date] = None
    resolved_date: Optional[date] = None
    status: Optional[str] = None


class FindingsReportOut(IncidentBaseSchema):
    finding_category: Optional[str] = None
    severity_level: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    responsible_party: Optional[str] = None
    due_date: Optional[date] = None
    resolved_date: Optional[date] = None

