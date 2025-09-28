#!/usr/bin/env python3
"""Test script to verify database connectivity and create tables"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database import create_tables, get_db, init_system_settings
from sqlalchemy.exc import OperationalError

def test_database():
    try:
        # Test database connection
        print("Testing database connection...")
        db = next(get_db())
        
        # Create tables
        print("Creating database tables...")
        create_tables()
        
        # Initialize system settings
        print("Initializing system settings...")
        init_system_settings(db)
        
        print("✅ Database setup completed successfully!")
        db.close()
        
    except OperationalError as e:
        print(f"❌ Database connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if test_database():
        print("Database is ready!")
        sys.exit(0)
    else:
        print("Database setup failed!")
        sys.exit(1)