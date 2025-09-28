from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
MYSQL_URL = os.environ.get('MYSQL_URL', 'mysql+pymysql://root:password@localhost:3306/autoclick_db')

engine = create_engine(MYSQL_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Database Models
class Site(Base):
    __tablename__ = "sites"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    duration = Column(Integer, default=5)  # seconds
    interval = Column(Integer, default=10)  # seconds
    is_active = Column(Boolean, default=False)
    clicks = Column(Integer, default=0)
    last_access = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    level = Column(String(20), nullable=False)  # info, warning, error, success
    action = Column(String(255), nullable=False)
    site_name = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    duration = Column(Float, nullable=True)  # execution duration in seconds
    created_at = Column(DateTime, server_default=func.now())

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(String(500), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# Database functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def init_system_settings(db: Session):
    """Initialize default system settings"""
    default_settings = [
        {"key": "global_interval", "value": "10"},
        {"key": "max_sites", "value": "10"},
        {"key": "browser_type", "value": "firefox"},
        {"key": "execution_mode", "value": "load_only"},
        {"key": "system_status", "value": "stopped"},
        {"key": "is_paused", "value": "false"}
    ]
    
    for setting in default_settings:
        existing = db.query(SystemSettings).filter(SystemSettings.key == setting["key"]).first()
        if not existing:
            db_setting = SystemSettings(**setting)
            db.add(db_setting)
    
    db.commit()

def get_setting(db: Session, key: str) -> str:
    """Get a system setting value"""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    return setting.value if setting else None

def update_setting(db: Session, key: str, value: str):
    """Update a system setting"""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    if setting:
        setting.value = value
        setting.updated_at = func.now()
    else:
        setting = SystemSettings(key=key, value=value)
        db.add(setting)
    db.commit()
    return setting
