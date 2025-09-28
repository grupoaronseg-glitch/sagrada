from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks, Response
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
import json
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

# Import our modules
from database import (
    get_db, create_tables, init_system_settings, 
    Site, Log, SystemSettings, get_setting, update_setting
)
from models import (
    SiteCreate, SiteUpdate, Site as SiteSchema, 
    LogCreate, Log as LogSchema, LogLevel,
    SystemStatus, ControlCommand, ExportFormat,
    BulkSiteImport, SystemSettingUpdate
)
from automation_engine import AutomationEngine
from websocket_manager import manager as websocket_manager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(
    title="AutoClick Backend API",
    description="Backend API for the AutoClick web automation system",
    version="1.0.0"
)

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Initialize automation engine
automation_engine = AutomationEngine(websocket_manager)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and system settings"""
    try:
        # Create tables
        create_tables()
        logger.info("Database tables created successfully")
        
        # Initialize system settings
        db = next(get_db())
        init_system_settings(db)
        logger.info("System settings initialized")
        
        # Log system startup
        startup_log = Log(
            id=str(uuid.uuid4()),
            level="info",
            action="System Startup",
            message="AutoClick backend started successfully",
            timestamp=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        db.add(startup_log)
        db.commit()
        db.close()
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown"""
    await automation_engine.stop()
    logger.info("AutoClick backend shut down")

# ============== WEBSOCKET ENDPOINT ==============
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, client_id: Optional[str] = None):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.handle_client_message(websocket, data)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

# ============== SITE MANAGEMENT ENDPOINTS ==============

@api_router.get("/sites/export")
async def export_sites(db: Session = Depends(get_db)):
    """Export all sites configuration"""
    sites = db.query(Site).all()
    
    data = [
        {
            "name": site.name,
            "url": site.url,
            "duration": site.duration,
            "interval": site.interval
        }
        for site in sites
    ]
    
    filename = f"autoclick-sites-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    content = json.dumps(data, indent=2)
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/sites", response_model=List[SiteSchema])
async def get_sites(db: Session = Depends(get_db)):
    """Get all sites"""
    sites = db.query(Site).order_by(desc(Site.created_at)).all()
    return sites

@api_router.get("/sites/{site_id}", response_model=SiteSchema)
async def get_site(site_id: str, db: Session = Depends(get_db)):
    """Get a specific site"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site

@api_router.post("/sites", response_model=SiteSchema)
async def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    """Create a new site"""
    # Validate input data
    if not site.name or not site.name.strip():
        raise HTTPException(status_code=400, detail="Site name is required")
    
    if not site.url or not site.url.strip():
        raise HTTPException(status_code=400, detail="Site URL is required")
    
    # Validate URL format
    if not site.url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    
    # Validate duration and interval
    if site.duration < 1 or site.duration > 300:
        raise HTTPException(status_code=400, detail="Duration must be between 1 and 300 seconds")
    
    if site.interval < 1 or site.interval > 3600:
        raise HTTPException(status_code=400, detail="Interval must be between 1 and 3600 seconds")
    
    # Check if we've reached the maximum number of sites
    max_sites = int(get_setting(db, "max_sites") or "10")
    current_count = db.query(Site).count()
    
    if current_count >= max_sites:
        raise HTTPException(status_code=400, detail=f"Maximum number of sites ({max_sites}) reached")
    
    # Check if URL already exists
    existing_site = db.query(Site).filter(Site.url == site.url).first()
    if existing_site:
        raise HTTPException(status_code=400, detail="Site with this URL already exists")
    
    db_site = Site(
        id=str(uuid.uuid4()),
        name=site.name.strip(),
        url=site.url.strip(),
        duration=site.duration,
        interval=site.interval,
        is_active=False,
        clicks=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    
    # Log the creation
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="success",
        action="Site Created",
        site_name=site.name.strip(),
        message=f"Site '{site.name.strip()}' created successfully",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    # Broadcast to websockets
    await websocket_manager.broadcast({
        "type": "site_created",
        "data": {
            "site": {
                "id": db_site.id,
                "name": db_site.name,
                "url": db_site.url,
                "is_active": db_site.is_active
            }
        }
    })
    
    return db_site

@api_router.put("/sites/{site_id}", response_model=SiteSchema)
async def update_site(site_id: str, site_update: SiteUpdate, db: Session = Depends(get_db)):
    """Update a site"""
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    # Update fields
    update_data = site_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_site, field, value)
    
    db_site.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_site)
    
    # Log the update
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="info",
        action="Site Updated",
        site_name=db_site.name,
        message=f"Site '{db_site.name}' updated successfully",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    # Broadcast to websockets
    await websocket_manager.broadcast({
        "type": "site_updated",
        "data": {
            "site": {
                "id": db_site.id,
                "name": db_site.name,
                "url": db_site.url,
                "is_active": db_site.is_active
            }
        }
    })
    
    return db_site

@api_router.delete("/sites/{site_id}")
async def delete_site(site_id: str, db: Session = Depends(get_db)):
    """Delete a site"""
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    site_name = db_site.name
    db.delete(db_site)
    db.commit()
    
    # Log the deletion
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="warning",
        action="Site Deleted",
        site_name=site_name,
        message=f"Site '{site_name}' deleted successfully",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    # Broadcast to websockets
    await websocket_manager.broadcast({
        "type": "site_deleted",
        "data": {
            "site_id": site_id,
            "site_name": site_name
        }
    })
    
    return {"message": "Site deleted successfully"}

@api_router.post("/sites/{site_id}/toggle")
async def toggle_site(site_id: str, db: Session = Depends(get_db)):
    """Toggle site active status"""
    db_site = db.query(Site).filter(Site.id == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    db_site.is_active = not db_site.is_active
    db_site.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    status = "activated" if db_site.is_active else "deactivated"
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="info",
        action="Site Status Changed",
        site_name=db_site.name,
        message=f"Site '{db_site.name}' {status}",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    # Broadcast to websockets
    await websocket_manager.broadcast({
        "type": "site_toggled",
        "data": {
            "site_id": site_id,
            "is_active": db_site.is_active
        }
    })
    
    return {"message": f"Site {status} successfully", "is_active": db_site.is_active}

# ============== CONTROL ENDPOINTS ==============

@api_router.post("/control/start")
async def start_automation(db: Session = Depends(get_db)):
    """Start the automation system"""
    success = await automation_engine.start()
    if success:
        return {"message": "Automation started successfully", "status": "running"}
    else:
        raise HTTPException(status_code=400, detail="Failed to start automation")

@api_router.post("/control/pause")
async def pause_automation():
    """Pause/resume the automation system"""
    success = await automation_engine.pause()
    if success:
        status = "paused" if automation_engine.is_paused else "running"
        return {"message": f"Automation {status} successfully", "status": status}
    else:
        raise HTTPException(status_code=400, detail="Failed to pause/resume automation")

@api_router.post("/control/stop")
async def stop_automation():
    """Stop the automation system"""
    success = await automation_engine.stop()
    if success:
        return {"message": "Automation stopped successfully", "status": "stopped"}
    else:
        raise HTTPException(status_code=400, detail="Failed to stop automation")

@api_router.get("/status", response_model=SystemStatus)
async def get_system_status(db: Session = Depends(get_db)):
    """Get system status"""
    engine_status = await automation_engine.get_status()
    global_interval = int(get_setting(db, "global_interval") or "10")
    
    return SystemStatus(
        is_running=engine_status["is_running"],
        is_paused=engine_status["is_paused"],
        global_interval=global_interval,
        active_sites_count=engine_status["active_sites_count"],
        total_sites_count=engine_status["total_sites_count"],
        total_clicks=engine_status["total_clicks"],
        system_status="running" if engine_status["is_running"] else "stopped"
    )

# ============== LOGS ENDPOINTS ==============

@api_router.get("/logs", response_model=List[LogSchema])
async def get_logs(
    level: Optional[str] = Query(None, description="Filter by log level"),
    site_name: Optional[str] = Query(None, description="Filter by site name"),
    search: Optional[str] = Query(None, description="Search in message and action"),
    limit: int = Query(100, ge=1, le=1000, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    db: Session = Depends(get_db)
):
    """Get logs with optional filtering"""
    query = db.query(Log)
    
    if level:
        query = query.filter(Log.level == level)
    
    if site_name:
        query = query.filter(Log.site_name == site_name)
    
    if search:
        query = query.filter(
            or_(
                Log.message.contains(search),
                Log.action.contains(search)
            )
        )
    
    logs = query.order_by(desc(Log.timestamp)).offset(offset).limit(limit).all()
    return logs

@api_router.delete("/logs")
async def clear_logs(db: Session = Depends(get_db)):
    """Clear all logs"""
    deleted_count = db.query(Log).count()
    db.query(Log).delete()
    db.commit()
    
    # Add a log entry about clearing logs
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="warning",
        action="Logs Cleared",
        message=f"All logs cleared ({deleted_count} entries removed)",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    # Broadcast to websockets
    await websocket_manager.broadcast({
        "type": "logs_cleared",
        "data": {"deleted_count": deleted_count}
    })
    
    return {"message": f"Cleared {deleted_count} log entries"}

@api_router.get("/logs/export")
async def export_logs(
    format: ExportFormat = Query(ExportFormat.json, description="Export format"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    site_name: Optional[str] = Query(None, description="Filter by site name"),
    db: Session = Depends(get_db)
):
    """Export logs in different formats"""
    query = db.query(Log)
    
    if level:
        query = query.filter(Log.level == level)
    
    if site_name:
        query = query.filter(Log.site_name == site_name)
    
    logs = query.order_by(desc(Log.timestamp)).all()
    
    filename = f"autoclick-logs-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    if format == ExportFormat.json:
        data = [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "level": log.level,
                "action": log.action,
                "site_name": log.site_name,
                "message": log.message,
                "duration": log.duration
            }
            for log in logs
        ]
        content = json.dumps(data, indent=2)
        media_type = "application/json"
        filename += ".json"
    
    elif format == ExportFormat.csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Level", "Action", "Site Name", "Message", "Duration"])
        
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.level,
                log.action,
                log.site_name or "",
                log.message,
                log.duration or ""
            ])
        
        content = output.getvalue()
        media_type = "text/csv"
        filename += ".csv"
    
    elif format == ExportFormat.txt:
        lines = []
        for log in logs:
            site_info = f" - {log.site_name}" if log.site_name else ""
            duration_info = f" ({log.duration}s)" if log.duration else ""
            lines.append(
                f"[{log.timestamp.isoformat()}] {log.level.upper()}{site_info}: {log.action} - {log.message}{duration_info}"
            )
        
        content = "\n".join(lines)
        media_type = "text/plain"
        filename += ".txt"
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============== SETTINGS ENDPOINTS ==============

@api_router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    """Get all system settings"""
    settings = db.query(SystemSettings).all()
    return {setting.key: setting.value for setting in settings}

@api_router.put("/settings/{key}")
async def update_system_setting(
    key: str, 
    setting_update: SystemSettingUpdate, 
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    setting = update_setting(db, key, setting_update.value)
    
    # Log the update
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="info",
        action="Setting Updated",
        message=f"System setting '{key}' updated to '{setting_update.value}'",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    return {"message": f"Setting '{key}' updated successfully", "value": setting_update.value}

# ============== BULK OPERATIONS ==============

@api_router.post("/sites/import")
async def import_sites(bulk_import: BulkSiteImport, db: Session = Depends(get_db)):
    """Import multiple sites"""
    if bulk_import.replace_existing:
        # Delete all existing sites
        db.query(Site).delete()
    
    created_sites = []
    errors = []
    
    for site_data in bulk_import.sites:
        try:
            # Check if URL already exists (if not replacing)
            if not bulk_import.replace_existing:
                existing = db.query(Site).filter(Site.url == site_data.url).first()
                if existing:
                    errors.append(f"Site with URL {site_data.url} already exists")
                    continue
            
            db_site = Site(
                id=str(uuid.uuid4()),
                name=site_data.name,
                url=site_data.url,
                duration=site_data.duration,
                interval=site_data.interval,
                is_active=False,
                clicks=0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            db.add(db_site)
            created_sites.append(db_site)
            
        except Exception as e:
            errors.append(f"Error creating site {site_data.name}: {str(e)}")
    
    db.commit()
    
    # Log the import
    log_entry = Log(
        id=str(uuid.uuid4()),
        level="success",
        action="Sites Imported",
        message=f"Imported {len(created_sites)} sites successfully. {len(errors)} errors.",
        timestamp=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    
    return {
        "message": f"Import completed",
        "created_count": len(created_sites),
        "error_count": len(errors),
        "errors": errors
    }

@api_router.get("/sites/export")
async def export_sites(db: Session = Depends(get_db)):
    """Export all sites configuration"""
    sites = db.query(Site).all()
    
    data = [
        {
            "name": site.name,
            "url": site.url,
            "duration": site.duration,
            "interval": site.interval
        }
        for site in sites
    ]
    
    filename = f"autoclick-sites-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    content = json.dumps(data, indent=2)
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "engine_running": automation_engine.is_running,
        "active_browsers": len(automation_engine.active_browsers)
    }

@api_router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AutoClick Backend API",
        "version": "1.0.0",
        "status": "running"
    }

# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
