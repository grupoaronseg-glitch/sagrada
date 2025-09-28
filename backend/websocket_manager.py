import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.utcnow(),
            "last_ping": datetime.utcnow()
        }
        logger.info(f"WebSocket client connected: {self.connection_info[websocket]['client_id']}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connected",
            "data": {
                "message": "Connected to AutoClick System",
                "client_id": self.connection_info[websocket]["client_id"]
            },
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            client_id = self.connection_info.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            if websocket in self.connection_info:
                del self.connection_info[websocket]
            logger.info(f"WebSocket client disconnected: {client_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            if websocket in self.active_connections:
                await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        message_str = json.dumps(message, default=str)
        
        # Create a copy of connections to avoid modification during iteration
        connections_copy = self.active_connections.copy()
        
        for connection in connections_copy:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                self.disconnect(connection)
    
    async def send_to_client(self, client_id: str, message: dict):
        """Send message to specific client"""
        for websocket, info in self.connection_info.items():
            if info["client_id"] == client_id:
                await self.send_personal_message(message, websocket)
                break
    
    def get_connected_clients(self) -> List[Dict[str, Any]]:
        """Get information about all connected clients"""
        return [
            {
                "client_id": info["client_id"],
                "connected_at": info["connected_at"].isoformat(),
                "last_ping": info["last_ping"].isoformat()
            }
            for info in self.connection_info.values()
        ]
    
    async def ping_all_clients(self):
        """Send ping to all clients to keep connections alive"""
        ping_message = {
            "type": "ping",
            "data": {"timestamp": datetime.utcnow().isoformat()}
        }
        await self.broadcast(ping_message)
    
    async def handle_client_message(self, websocket: WebSocket, message: str):
        """Handle incoming messages from clients"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            client_id = self.connection_info.get(websocket, {}).get("client_id")
            
            if message_type == "pong":
                # Update last ping time
                if websocket in self.connection_info:
                    self.connection_info[websocket]["last_ping"] = datetime.utcnow()
            
            elif message_type == "ping":
                # Respond with pong
                await self.send_personal_message({
                    "type": "pong",
                    "data": {"timestamp": datetime.utcnow().isoformat()}
                }, websocket)
            
            elif message_type == "subscribe":
                # Handle subscription to specific events
                channels = data.get("data", {}).get("channels", [])
                logger.info(f"Client {client_id} subscribed to channels: {channels}")
                await self.send_personal_message({
                    "type": "subscribed",
                    "data": {"channels": channels}
                }, websocket)
            
            else:
                logger.warning(f"Unknown message type from client {client_id}: {message_type}")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from client")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")

# Global connection manager instance
manager = ConnectionManager()
