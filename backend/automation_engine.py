import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import logging
from sqlalchemy.orm import Session
from database import get_db, Site, Log, get_setting, update_setting
from models import LogCreate, LogLevel
import json
from concurrent.futures import ThreadPoolExecutor
import threading

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self, websocket_manager=None):
        self.is_running = False
        self.is_paused = False
        self.websocket_manager = websocket_manager
        self.active_browsers: Dict[str, webdriver.Firefox] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.site_threads: Dict[str, threading.Thread] = {}
        self.stop_events: Dict[str, threading.Event] = {}
        
    def create_browser(self) -> webdriver.Firefox:
        """Create a Firefox browser instance"""
        options = FirefoxOptions()
        options.add_argument('--headless')  # Run headless for server environment
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        try:
            # Try to use geckodriver from system PATH
            browser = webdriver.Firefox(options=options)
            browser.set_page_load_timeout(30)
            browser.implicitly_wait(10)
            return browser
        except Exception as e:
            logger.error(f"Failed to create Firefox browser: {e}")
            raise
    
    async def log_event(self, level: LogLevel, action: str, message: str, site_name: str = None, duration: float = None):
        """Log an event to database and websocket"""
        try:
            db = next(get_db())
            log_entry = Log(
                id=str(uuid.uuid4()),
                level=level.value,
                action=action,
                site_name=site_name,
                message=message,
                duration=duration,
                timestamp=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc)
            )
            db.add(log_entry)
            db.commit()
            
            # Send to websocket if available
            if self.websocket_manager:
                await self.websocket_manager.broadcast({
                    "type": "log",
                    "data": {
                        "id": log_entry.id,
                        "timestamp": log_entry.timestamp.isoformat(),
                        "level": log_entry.level,
                        "action": log_entry.action,
                        "site_name": log_entry.site_name,
                        "message": log_entry.message,
                        "duration": log_entry.duration
                    }
                })
        except Exception as e:
            logger.error(f"Failed to log event: {e}")
        finally:
            db.close()
    
    async def process_site(self, site: Site, global_interval: int):
        """Process a single site in a separate thread"""
        site_id = site.id
        stop_event = threading.Event()
        self.stop_events[site_id] = stop_event
        
        def run_site_loop():
            browser = None
            try:
                browser = self.create_browser()
                self.active_browsers[site_id] = browser
                
                while not stop_event.is_set() and self.is_running:
                    if self.is_paused:
                        time.sleep(1)
                        continue
                    
                    start_time = time.time()
                    
                    try:
                        # Log site opening
                        asyncio.run(self.log_event(
                            LogLevel.info,
                            "Site Opening",
                            f"Opening {site.name}",
                            site.name
                        ))
                        
                        # Navigate to the site
                        browser.get(site.url)
                        
                        # Wait for page to load
                        WebDriverWait(browser, 10).until(
                            lambda driver: driver.execute_script("return document.readyState") == "complete"
                        )
                        
                        # Log successful load
                        load_time = time.time() - start_time
                        asyncio.run(self.log_event(
                            LogLevel.success,
                            "Site Loaded",
                            f"Successfully loaded {site.name}",
                            site.name,
                            load_time
                        ))
                        
                        # Wait for the configured duration
                        time.sleep(site.duration)
                        
                        # Update site statistics
                        db = next(get_db())
                        try:
                            db_site = db.query(Site).filter(Site.id == site_id).first()
                            if db_site:
                                db_site.clicks += 1
                                db_site.last_access = datetime.now(timezone.utc)
                                db.commit()
                        finally:
                            db.close()
                        
                        # Log site closing
                        total_time = time.time() - start_time
                        asyncio.run(self.log_event(
                            LogLevel.info,
                            "Site Closed",
                            f"Closed {site.name} after {site.duration}s",
                            site.name,
                            total_time
                        ))
                        
                    except TimeoutException:
                        asyncio.run(self.log_event(
                            LogLevel.error,
                            "Timeout Error",
                            f"Timeout loading {site.name}",
                            site.name
                        ))
                    except WebDriverException as e:
                        asyncio.run(self.log_event(
                            LogLevel.error,
                            "Browser Error",
                            f"Browser error for {site.name}: {str(e)}",
                            site.name
                        ))
                    except Exception as e:
                        asyncio.run(self.log_event(
                            LogLevel.error,
                            "Unexpected Error",
                            f"Unexpected error for {site.name}: {str(e)}",
                            site.name
                        ))
                    
                    # Wait for the interval before next execution
                    if not stop_event.wait(global_interval):
                        continue
                    else:
                        break
                        
            except Exception as e:
                asyncio.run(self.log_event(
                    LogLevel.error,
                    "Engine Error",
                    f"Critical error in site processing for {site.name}: {str(e)}",
                    site.name
                ))
            finally:
                # Clean up browser
                if browser:
                    try:
                        browser.quit()
                    except:
                        pass
                
                # Remove from active browsers
                if site_id in self.active_browsers:
                    del self.active_browsers[site_id]
        
        # Start the site processing thread
        thread = threading.Thread(target=run_site_loop, daemon=True)
        self.site_threads[site_id] = thread
        thread.start()
    
    async def start(self):
        """Start the automation engine"""
        if self.is_running:
            return False
        
        try:
            db = next(get_db())
            
            # Get active sites
            active_sites = db.query(Site).filter(Site.is_active == True).all()
            
            if not active_sites:
                await self.log_event(
                    LogLevel.warning,
                    "Start Failed",
                    "No active sites found"
                )
                return False
            
            # Get global interval
            global_interval = int(get_setting(db, "global_interval") or "10")
            
            self.is_running = True
            self.is_paused = False
            
            # Update system settings
            update_setting(db, "system_status", "running")
            update_setting(db, "is_paused", "false")
            
            await self.log_event(
                LogLevel.success,
                "System Started",
                f"Started automation for {len(active_sites)} sites"
            )
            
            # Start processing each active site
            for site in active_sites:
                await self.process_site(site, global_interval)
            
            # Broadcast status update
            if self.websocket_manager:
                await self.websocket_manager.broadcast({
                    "type": "status",
                    "data": {
                        "is_running": True,
                        "is_paused": False,
                        "active_sites_count": len(active_sites)
                    }
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start automation engine: {e}")
            await self.log_event(
                LogLevel.error,
                "Start Error",
                f"Failed to start system: {str(e)}"
            )
            return False
        finally:
            db.close()
    
    async def pause(self):
        """Pause the automation engine"""
        if not self.is_running:
            return False
        
        self.is_paused = not self.is_paused
        
        try:
            db = next(get_db())
            update_setting(db, "is_paused", "true" if self.is_paused else "false")
            
            action = "System Paused" if self.is_paused else "System Resumed"
            message = "System execution paused" if self.is_paused else "System execution resumed"
            
            await self.log_event(
                LogLevel.info,
                action,
                message
            )
            
            # Broadcast status update
            if self.websocket_manager:
                await self.websocket_manager.broadcast({
                    "type": "status",
                    "data": {
                        "is_running": True,
                        "is_paused": self.is_paused
                    }
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to pause/resume automation engine: {e}")
            return False
        finally:
            db.close()
    
    async def stop(self):
        """Stop the automation engine"""
        if not self.is_running:
            return False
        
        try:
            self.is_running = False
            self.is_paused = False
            
            # Stop all site threads
            for site_id, stop_event in self.stop_events.items():
                stop_event.set()
            
            # Wait for threads to finish
            for thread in self.site_threads.values():
                thread.join(timeout=5)
            
            # Close all browsers
            for browser in self.active_browsers.values():
                try:
                    browser.quit()
                except:
                    pass
            
            # Clear collections
            self.active_browsers.clear()
            self.site_threads.clear()
            self.stop_events.clear()
            
            # Update system settings
            db = next(get_db())
            update_setting(db, "system_status", "stopped")
            update_setting(db, "is_paused", "false")
            
            await self.log_event(
                LogLevel.info,
                "System Stopped",
                "Automation system stopped successfully"
            )
            
            # Broadcast status update
            if self.websocket_manager:
                await self.websocket_manager.broadcast({
                    "type": "status",
                    "data": {
                        "is_running": False,
                        "is_paused": False
                    }
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop automation engine: {e}")
            return False
        finally:
            if 'db' in locals():
                db.close()
    
    async def get_status(self) -> dict:
        """Get current engine status"""
        try:
            db = next(get_db())
            
            active_sites_count = db.query(Site).filter(Site.is_active == True).count()
            total_sites_count = db.query(Site).count()
            total_clicks = db.query(Site).with_entities(Site.clicks).all()
            total_clicks = sum([clicks[0] for clicks in total_clicks])
            
            return {
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "active_sites_count": active_sites_count,
                "total_sites_count": total_sites_count,
                "total_clicks": total_clicks,
                "active_browsers_count": len(self.active_browsers)
            }
        except Exception as e:
            logger.error(f"Failed to get engine status: {e}")
            return {
                "is_running": False,
                "is_paused": False,
                "active_sites_count": 0,
                "total_sites_count": 0,
                "total_clicks": 0,
                "active_browsers_count": 0
            }
        finally:
            db.close()
