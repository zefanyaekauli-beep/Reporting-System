# backend/app/services/notification_service.py

from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict
from app.models.employee import Contract, Employee
from app.core.logger import api_logger


class NotificationService:
    """Service for sending notifications (contract expiry, etc.)."""
    
    def check_contract_expiry(self, db: Session, days_ahead: int = 30) -> List[Dict]:
        """
        Check for contracts expiring within specified days.
        Returns list of contracts that need notification.
        """
        today = date.today()
        expiry_date = today + timedelta(days=days_ahead)
        
        contracts = (
            db.query(Contract)
            .join(Employee)
            .filter(
                Contract.end_date.isnot(None),
                Contract.end_date >= today,
                Contract.end_date <= expiry_date,
                Contract.status == "ACTIVE",
            )
            .all()
        )
        
        result = []
        for contract in contracts:
            days_until_expiry = (contract.end_date - today).days
            
            # Determine notification priority
            if days_until_expiry <= 7:
                priority = "URGENT"
            elif days_until_expiry <= 30:
                priority = "HIGH"
            else:
                priority = "MEDIUM"
            
            employee = db.query(Employee).filter(Employee.id == contract.employee_id).first()
            
            result.append({
                "contract_id": contract.id,
                "employee_id": contract.employee_id,
                "employee_name": employee.full_name if employee else f"Employee {contract.employee_id}",
                "contract_type": contract.contract_type.value if hasattr(contract.contract_type, 'value') else str(contract.contract_type),
                "end_date": contract.end_date.isoformat(),
                "days_until_expiry": days_until_expiry,
                "priority": priority,
            })
        
        return result
    
    def send_contract_expiry_notifications(self, db: Session) -> int:
        """
        Send notifications for expiring contracts.
        Returns number of notifications sent.
        """
        # Check contracts expiring in 30 days
        contracts_30_days = self.check_contract_expiry(db, days_ahead=30)
        
        # Check contracts expiring in 7 days
        contracts_7_days = self.check_contract_expiry(db, days_ahead=7)
        
        # Check expired contracts
        today = date.today()
        expired_contracts = (
            db.query(Contract)
            .join(Employee)
            .filter(
                Contract.end_date.isnot(None),
                Contract.end_date < today,
                Contract.status == "ACTIVE",
            )
            .all()
        )
        
        notification_count = 0
        
        # Send notifications for 30-day warning
        for contract_info in contracts_30_days:
            if contract_info["days_until_expiry"] > 7:  # Only 30-day warnings
                # TODO: Send email, in-app notification, SMS
                api_logger.info(
                    f"Contract expiry notification: Employee {contract_info['employee_name']} "
                    f"contract expires in {contract_info['days_until_expiry']} days"
                )
                notification_count += 1
        
        # Send notifications for 7-day warning
        for contract_info in contracts_7_days:
            if contract_info["days_until_expiry"] <= 7:
                # TODO: Send email, in-app notification, SMS
                api_logger.warning(
                    f"URGENT: Contract expiry notification: Employee {contract_info['employee_name']} "
                    f"contract expires in {contract_info['days_until_expiry']} days"
                )
                notification_count += 1
        
        # Send notifications for expired contracts
        for contract in expired_contracts:
            employee = db.query(Employee).filter(Employee.id == contract.employee_id).first()
            # TODO: Send email, in-app notification, SMS
            api_logger.error(
                f"EXPIRED: Contract {contract.id} for employee {employee.full_name if employee else contract.employee_id} has expired"
            )
            notification_count += 1
        
        return notification_count

