from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Pydantic Models for API
class SiteBase(BaseModel):
    name: str
    url: str
    duration: int = 5
    interval: int = 10

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    duration: Optional[int] = None
    interval: Optional[int] = None
    is_active: Optional[bool] = None

class Site(SiteBase):
    id: str
    is_active: bool
    clicks: int
    last_access: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LogLevel(str, Enum):
    info = "info"
    warning = "warning"
    error = "error"
    success = "success"

class LogBase(BaseModel):
    level: LogLevel
    action: str
    site_name: Optional[str] = None
    message: str
    duration: Optional[float] = None

class LogCreate(LogBase):
    pass

class Log(LogBase):
    id: str
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class SystemSettingBase(BaseModel):
    key: str
    value: str

class SystemSettingUpdate(BaseModel):
    value: str

class SystemSetting(SystemSettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class SystemStatus(BaseModel):
    is_running: bool
    is_paused: bool
    global_interval: int
    active_sites_count: int
    total_sites_count: int
    total_clicks: int
    system_status: str

class ControlCommand(BaseModel):
    action: str  # start, pause, stop
    global_interval: Optional[int] = None

class ExportFormat(str, Enum):
    txt = "txt"
    csv = "csv"
    json = "json"

class WebSocketMessage(BaseModel):
    type: str  # log, status, error
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class BulkSiteImport(BaseModel):
    sites: List[SiteCreate]
    replace_existing: bool = False
