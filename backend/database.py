# backend/database.py
import sqlite3
import json
import os
from datetime import datetime

# Database file will be created in the same directory as this file
DB_PATH = os.path.join(os.path.dirname(__file__), 'gov_forms.db')

def get_connection():
    """Establish SQLite connection and enable foreign keys"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key support
    return conn

def init_db():
    """Initialize the database and create tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create applications table with all required fields
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT UNIQUE,
        scheme_name TEXT NOT NULL,
        applicant_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        approved_date TIMESTAMP NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        application_data TEXT NOT NULL
    )
    """)
    
    # Create indexes for better query performance
    cursor.execute("""CREATE INDEX IF NOT EXISTS idx_applications_status 
                    ON applications(status)""")
    cursor.execute("""CREATE INDEX IF NOT EXISTS idx_applications_timestamp 
                    ON applications(timestamp)""")
    
    conn.commit()
    conn.close()

def save_application(scheme_name, form_data):
    """Insert new application record"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        application_id = form_data.get('application_id', '')
        applicant_name = form_data.get('name', 'Unknown')
        phone = form_data.get('phone', 'N/A')
        address = f"{form_data.get('district', '')}, {form_data.get('state', '')}"
        
        cursor.execute("""
            INSERT INTO applications 
            (application_id, scheme_name, applicant_name, phone, address, application_data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            application_id,
            scheme_name,
            applicant_name,
            phone,
            address,
            json.dumps(form_data)
        ))
        app_id = cursor.lastrowid
        conn.commit()
        return app_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_all_applications():
    """Fetch all submitted applications"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                id,
                application_id,
                scheme_name,
                applicant_name,
                phone,
                address,
                status,
                approved_date,
                timestamp,
                application_data
            FROM applications 
            ORDER BY timestamp DESC
        """)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def update_application_status(application_id, status):
    """Update application status"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE applications 
            SET status = ?,
                approved_date = CASE WHEN ? = 'Approved' THEN CURRENT_TIMESTAMP ELSE approved_date END
            WHERE application_id = ?
        """, (status, status, application_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
