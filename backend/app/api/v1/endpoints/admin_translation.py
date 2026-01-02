# backend/app/api/v1/endpoints/admin_translation.py

"""
Admin Translation Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_admin

router = APIRouter(prefix="/admin/translation", tags=["admin-translation"])


class TranslationKeyOut(BaseModel):
    key: str
    translations: Dict[str, str]  # language -> translation

    class Config:
        from_attributes = True


class TranslationUpdate(BaseModel):
    translations: Dict[str, str]  # language -> translation


@router.get("", response_model=List[TranslationKeyOut])
def list_translations(
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List translation keys"""
    try:
        # TODO: Implement database storage for translations
        # For now, return sample translations
        translations = [
            TranslationKeyOut(
                key="dashboard.title",
                translations={
                    "en": "Dashboard",
                    "id": "Dasbor",
                }
            ),
            TranslationKeyOut(
                key="attendance.title",
                translations={
                    "en": "Attendance",
                    "id": "Kehadiran",
                }
            ),
            TranslationKeyOut(
                key="reports.title",
                translations={
                    "en": "Reports",
                    "id": "Laporan",
                }
            ),
        ]
        
        return translations
    except Exception as e:
        api_logger.error(f"Error listing translations: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_translations")


@router.put("/{key}", response_model=TranslationKeyOut)
def update_translation(
    key: str,
    translation_data: TranslationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update translation for a key"""
    try:
        # TODO: Store in database
        return TranslationKeyOut(
            key=key,
            translations=translation_data.translations,
        )
    except Exception as e:
        api_logger.error(f"Error updating translation: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_translation")

