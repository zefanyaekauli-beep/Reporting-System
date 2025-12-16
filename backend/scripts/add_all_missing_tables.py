#!/usr/bin/env python3
"""
Script to add all missing tables for Phases 1-20.
Run: python scripts/add_all_missing_tables.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
from pathlib import Path

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def table_exists(cursor, table_name):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    return cursor.fetchone() is not None

def create_table_if_not_exists(cursor, table_name, create_sql, indexes_sql=None):
    if table_exists(cursor, table_name):
        print(f"Table '{table_name}' already exists. Skipping.")
        return False
    
    print(f"Creating table '{table_name}'...")
    cursor.execute(create_sql)
    
    if indexes_sql:
        for index_sql in indexes_sql:
            cursor.execute(index_sql)
    
    print(f"Table '{table_name}' created successfully.")
    return True

try:
    # 1. Trainings table
    create_table_if_not_exists(
        cursor,
        "trainings",
        """
        CREATE TABLE trainings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            site_id INTEGER,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(64),
            scheduled_date DATETIME NOT NULL,
            duration_minutes INTEGER,
            location VARCHAR(255),
            instructor_id INTEGER,
            instructor_name VARCHAR(255),
            max_participants INTEGER,
            min_participants INTEGER NOT NULL DEFAULT 1,
            status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
            materials_url VARCHAR(512),
            materials_path VARCHAR(512),
            division VARCHAR(32),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            created_by INTEGER,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (site_id) REFERENCES sites(id),
            FOREIGN KEY (instructor_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_trainings_company_id ON trainings(company_id)",
            "CREATE INDEX idx_trainings_site_id ON trainings(site_id)",
            "CREATE INDEX idx_trainings_category ON trainings(category)",
            "CREATE INDEX idx_trainings_scheduled_date ON trainings(scheduled_date)",
            "CREATE INDEX idx_trainings_status ON trainings(status)",
            "CREATE INDEX idx_trainings_division ON trainings(division)",
        ]
    )
    
    # 2. Training Attendances table
    create_table_if_not_exists(
        cursor,
        "training_attendances",
        """
        CREATE TABLE training_attendances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            training_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            registered_at DATETIME NOT NULL,
            attendance_status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
            attended_at DATETIME,
            score INTEGER,
            passed BOOLEAN,
            completion_date DATETIME,
            certificate_url VARCHAR(512),
            certificate_path VARCHAR(512),
            feedback TEXT,
            rating INTEGER,
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (training_id) REFERENCES trainings(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_training_attendances_training_id ON training_attendances(training_id)",
            "CREATE INDEX idx_training_attendances_user_id ON training_attendances(user_id)",
        ]
    )
    
    # 3. Development Plans table
    create_table_if_not_exists(
        cursor,
        "development_plans",
        """
        CREATE TABLE development_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            development_type VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            start_date DATE,
            end_date DATE,
            target_date DATE,
            progress_percentage REAL NOT NULL DEFAULT 0.0,
            status VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
            evaluation_notes TEXT,
            completed_at DATETIME,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            created_by INTEGER,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_development_plans_company_id ON development_plans(company_id)",
            "CREATE INDEX idx_development_plans_user_id ON development_plans(user_id)",
            "CREATE INDEX idx_development_plans_status ON development_plans(status)",
        ]
    )
    
    # 4. Visitors table (check if already exists from previous script)
    create_table_if_not_exists(
        cursor,
        "visitors",
        """
        CREATE TABLE visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            site_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            company VARCHAR(255),
            id_card_number VARCHAR(64),
            id_card_type VARCHAR(32),
            phone VARCHAR(32),
            email VARCHAR(255),
            purpose VARCHAR(255),
            category VARCHAR(64),
            visit_date DATETIME NOT NULL,
            expected_duration_minutes INTEGER,
            check_in_time DATETIME,
            check_out_time DATETIME,
            is_checked_in BOOLEAN NOT NULL DEFAULT 0,
            host_user_id INTEGER,
            host_name VARCHAR(255),
            security_user_id INTEGER,
            badge_number VARCHAR(32),
            photo_path VARCHAR(512),
            id_card_photo_path VARCHAR(512),
            status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (site_id) REFERENCES sites(id),
            FOREIGN KEY (host_user_id) REFERENCES users(id),
            FOREIGN KEY (security_user_id) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_visitors_company_id ON visitors(company_id)",
            "CREATE INDEX idx_visitors_site_id ON visitors(site_id)",
            "CREATE INDEX idx_visitors_category ON visitors(category)",
            "CREATE INDEX idx_visitors_visit_date ON visitors(visit_date)",
            "CREATE INDEX idx_visitors_check_in_time ON visitors(check_in_time)",
            "CREATE INDEX idx_visitors_check_out_time ON visitors(check_out_time)",
            "CREATE INDEX idx_visitors_is_checked_in ON visitors(is_checked_in)",
            "CREATE INDEX idx_visitors_status ON visitors(status)",
        ]
    )
    
    # 5. Documents table
    create_table_if_not_exists(
        cursor,
        "documents",
        """
        CREATE TABLE documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER,
            title VARCHAR(255) NOT NULL,
            document_type VARCHAR(32) NOT NULL,
            document_number VARCHAR(128) UNIQUE,
            version VARCHAR(32) NOT NULL DEFAULT '1.0',
            revision_date DATE,
            effective_date DATE,
            status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
            file_path VARCHAR(512) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(128),
            category VARCHAR(128),
            division VARCHAR(32),
            approved_by INTEGER,
            approved_at DATETIME,
            approval_notes TEXT,
            description TEXT,
            tags VARCHAR(512),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            created_by INTEGER,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (approved_by) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_documents_company_id ON documents(company_id)",
            "CREATE INDEX idx_documents_document_type ON documents(document_type)",
            "CREATE INDEX idx_documents_document_number ON documents(document_number)",
            "CREATE INDEX idx_documents_effective_date ON documents(effective_date)",
            "CREATE INDEX idx_documents_status ON documents(status)",
            "CREATE INDEX idx_documents_category ON documents(category)",
            "CREATE INDEX idx_documents_division ON documents(division)",
        ]
    )
    
    # 6. Document Versions table
    create_table_if_not_exists(
        cursor,
        "document_versions",
        """
        CREATE TABLE document_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            version VARCHAR(32) NOT NULL,
            revision_date DATE,
            file_path VARCHAR(512) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            change_summary TEXT,
            changes_made_by INTEGER,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id),
            FOREIGN KEY (changes_made_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_document_versions_document_id ON document_versions(document_id)",
        ]
    )
    
    # 7. Sync Queue table
    create_table_if_not_exists(
        cursor,
        "sync_queue",
        """
        CREATE TABLE sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            operation_type VARCHAR(32) NOT NULL,
            resource_type VARCHAR(64) NOT NULL,
            resource_id INTEGER,
            data TEXT NOT NULL,
            original_data TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            retry_count INTEGER NOT NULL DEFAULT 0,
            max_retries INTEGER NOT NULL DEFAULT 3,
            created_at DATETIME NOT NULL,
            processed_at DATETIME,
            completed_at DATETIME,
            error_message TEXT,
            error_details TEXT,
            has_conflict BOOLEAN NOT NULL DEFAULT 0,
            conflict_resolution VARCHAR(32),
            device_id VARCHAR(128),
            offline_timestamp DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """,
        [
            "CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id)",
            "CREATE INDEX idx_sync_queue_company_id ON sync_queue(company_id)",
            "CREATE INDEX idx_sync_queue_operation_type ON sync_queue(operation_type)",
            "CREATE INDEX idx_sync_queue_resource_type ON sync_queue(resource_type)",
            "CREATE INDEX idx_sync_queue_status ON sync_queue(status)",
            "CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at)",
        ]
    )
    
    # 8. Payrolls table
    create_table_if_not_exists(
        cursor,
        "payrolls",
        """
        CREATE TABLE payrolls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            pay_date DATE,
            base_salary INTEGER NOT NULL DEFAULT 0,
            overtime_hours INTEGER NOT NULL DEFAULT 0,
            overtime_pay INTEGER NOT NULL DEFAULT 0,
            allowances INTEGER NOT NULL DEFAULT 0,
            bonuses INTEGER NOT NULL DEFAULT 0,
            other_earnings INTEGER NOT NULL DEFAULT 0,
            tax INTEGER NOT NULL DEFAULT 0,
            insurance INTEGER NOT NULL DEFAULT 0,
            loan_deduction INTEGER NOT NULL DEFAULT 0,
            other_deductions INTEGER NOT NULL DEFAULT 0,
            total_gross INTEGER NOT NULL,
            total_deductions INTEGER NOT NULL,
            net_pay INTEGER NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
            approved_by INTEGER,
            approved_at DATETIME,
            invoice_number VARCHAR(128) UNIQUE,
            invoice_path VARCHAR(512),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            created_by INTEGER,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (approved_by) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_payrolls_company_id ON payrolls(company_id)",
            "CREATE INDEX idx_payrolls_user_id ON payrolls(user_id)",
            "CREATE INDEX idx_payrolls_period_start ON payrolls(period_start)",
            "CREATE INDEX idx_payrolls_period_end ON payrolls(period_end)",
            "CREATE INDEX idx_payrolls_status ON payrolls(status)",
            "CREATE INDEX idx_payrolls_invoice_number ON payrolls(invoice_number)",
        ]
    )
    
    # 9. Payments table
    create_table_if_not_exists(
        cursor,
        "payments",
        """
        CREATE TABLE payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payroll_id INTEGER NOT NULL,
            payment_method VARCHAR(32) NOT NULL,
            payment_gateway VARCHAR(64),
            amount INTEGER NOT NULL,
            transaction_id VARCHAR(128) UNIQUE,
            reference_number VARCHAR(128),
            status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            initiated_at DATETIME NOT NULL,
            paid_at DATETIME,
            gateway_response TEXT,
            gateway_url VARCHAR(512),
            error_message TEXT,
            error_code VARCHAR(64),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (payroll_id) REFERENCES payrolls(id)
        )
        """,
        [
            "CREATE INDEX idx_payments_payroll_id ON payments(payroll_id)",
            "CREATE INDEX idx_payments_transaction_id ON payments(transaction_id)",
            "CREATE INDEX idx_payments_status ON payments(status)",
        ]
    )
    
    # 10. Employees table
    create_table_if_not_exists(
        cursor,
        "employees",
        """
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            user_id INTEGER UNIQUE,
            nik VARCHAR(32) UNIQUE,
            full_name VARCHAR(255) NOT NULL,
            first_name VARCHAR(128),
            last_name VARCHAR(128),
            date_of_birth DATE,
            place_of_birth VARCHAR(128),
            gender VARCHAR(16),
            blood_type VARCHAR(8),
            email VARCHAR(255),
            phone VARCHAR(32),
            address TEXT,
            city VARCHAR(128),
            postal_code VARCHAR(16),
            employee_number VARCHAR(64) UNIQUE,
            position VARCHAR(128),
            division VARCHAR(32),
            site_id INTEGER,
            department VARCHAR(128),
            hire_date DATE,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            photo_path VARCHAR(512),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (site_id) REFERENCES sites(id)
        )
        """,
        [
            "CREATE INDEX idx_employees_company_id ON employees(company_id)",
            "CREATE INDEX idx_employees_user_id ON employees(user_id)",
            "CREATE INDEX idx_employees_nik ON employees(nik)",
            "CREATE INDEX idx_employees_email ON employees(email)",
            "CREATE INDEX idx_employees_employee_number ON employees(employee_number)",
            "CREATE INDEX idx_employees_status ON employees(status)",
            "CREATE INDEX idx_employees_site_id ON employees(site_id)",
        ]
    )
    
    # 11. Employee Contracts table
    create_table_if_not_exists(
        cursor,
        "employee_contracts",
        """
        CREATE TABLE employee_contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            contract_type VARCHAR(32) NOT NULL,
            contract_number VARCHAR(128) UNIQUE,
            start_date DATE NOT NULL,
            end_date DATE,
            base_salary INTEGER,
            allowances INTEGER NOT NULL DEFAULT 0,
            benefits TEXT,
            terms TEXT,
            probation_period_days INTEGER,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            signed_date DATE,
            signed_by VARCHAR(255),
            notes TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
        """,
        [
            "CREATE INDEX idx_employee_contracts_employee_id ON employee_contracts(employee_id)",
            "CREATE INDEX idx_employee_contracts_contract_number ON employee_contracts(contract_number)",
            "CREATE INDEX idx_employee_contracts_start_date ON employee_contracts(start_date)",
            "CREATE INDEX idx_employee_contracts_end_date ON employee_contracts(end_date)",
            "CREATE INDEX idx_employee_contracts_status ON employee_contracts(status)",
        ]
    )
    
    conn.commit()
    print("\nAll tables checked and created successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    conn.rollback()
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
    sys.exit(1)
finally:
    conn.close()

