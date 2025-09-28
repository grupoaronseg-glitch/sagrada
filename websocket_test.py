#!/usr/bin/env python3
"""
WebSocket Testing for AutoClick System
Tests real-time communication functionality
"""

import asyncio
import websockets
import json
import sys
from datetime import datetime

class WebSocketTester:
    def __init__(self, ws_url="wss://webclicker.preview.emergentagent.com/ws"):
        self.ws_url = ws_url
        self.messages_received = []
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test_name": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")
        
    async def test_websocket_connection(self):
        """Test WebSocket connection and basic communication"""
        try:
            print("🔌 Testing WebSocket Connection...")
            
            async with websockets.connect(self.ws_url, timeout=10) as websocket:
                self.log_test("WebSocket Connection", True, "Successfully connected")
                
                # Wait for welcome message
                try:
                    welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5)
                    welcome_data = json.loads(welcome_msg)
                    
                    if welcome_data.get("type") == "connected":
                        self.log_test("Welcome Message", True, f"Received welcome: {welcome_data.get('data', {}).get('message', 'N/A')}")
                    else:
                        self.log_test("Welcome Message", False, f"Unexpected message type: {welcome_data.get('type')}")
                        
                except asyncio.TimeoutError:
                    self.log_test("Welcome Message", False, "No welcome message received within timeout")
                
                # Test ping-pong
                ping_msg = {
                    "type": "ping",
                    "data": {"timestamp": datetime.now().isoformat()}
                }
                
                await websocket.send(json.dumps(ping_msg))
                self.log_test("Send Ping", True, "Ping message sent")
                
                try:
                    pong_response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    pong_data = json.loads(pong_response)
                    
                    if pong_data.get("type") == "pong":
                        self.log_test("Receive Pong", True, "Pong response received")
                    else:
                        self.log_test("Receive Pong", False, f"Expected pong, got: {pong_data.get('type')}")
                        
                except asyncio.TimeoutError:
                    self.log_test("Receive Pong", False, "No pong response received")
                
                # Test subscription
                subscribe_msg = {
                    "type": "subscribe",
                    "data": {"channels": ["logs", "status", "sites"]}
                }
                
                await websocket.send(json.dumps(subscribe_msg))
                self.log_test("Send Subscribe", True, "Subscription message sent")
                
                try:
                    sub_response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    sub_data = json.loads(sub_response)
                    
                    if sub_data.get("type") == "subscribed":
                        self.log_test("Receive Subscription Ack", True, f"Subscribed to: {sub_data.get('data', {}).get('channels', [])}")
                    else:
                        self.log_test("Receive Subscription Ack", False, f"Unexpected response: {sub_data.get('type')}")
                        
                except asyncio.TimeoutError:
                    self.log_test("Receive Subscription Ack", False, "No subscription acknowledgment received")
                
                # Listen for real-time messages for a short period
                print("👂 Listening for real-time messages...")
                try:
                    for i in range(3):  # Listen for up to 3 messages or 10 seconds
                        message = await asyncio.wait_for(websocket.recv(), timeout=10)
                        msg_data = json.loads(message)
                        self.messages_received.append(msg_data)
                        print(f"   📨 Received: {msg_data.get('type', 'unknown')} - {msg_data.get('data', {})}")
                        
                except asyncio.TimeoutError:
                    print("   ⏰ Timeout waiting for real-time messages")
                
                if self.messages_received:
                    self.log_test("Real-time Messages", True, f"Received {len(self.messages_received)} real-time messages")
                else:
                    self.log_test("Real-time Messages", False, "No real-time messages received")
                
                return True
                
        except websockets.exceptions.ConnectionClosed as e:
            self.log_test("WebSocket Connection", False, f"Connection closed: {e}")
            return False
        except websockets.exceptions.WebSocketException as e:
            self.log_test("WebSocket Connection", False, f"WebSocket error: {e}")
            return False
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Unexpected error: {e}")
            return False
    
    async def run_tests(self):
        """Run all WebSocket tests"""
        print("🚀 Starting WebSocket Tests")
        print(f"📍 Testing against: {self.ws_url}")
        print("=" * 50)
        
        success = await self.test_websocket_connection()
        
        print("\n" + "=" * 50)
        print("📋 WEBSOCKET TEST RESULTS")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if r["status"] == "FAIL"]
        if failed_tests:
            print(f"\n🚨 FAILED TESTS:")
            for test in failed_tests:
                print(f"   ❌ {test['test_name']}: {test['details']}")
        
        return success

async def main():
    """Main test execution"""
    tester = WebSocketTester()
    
    try:
        success = await tester.run_tests()
        
        # Save results
        results_file = "/app/test_reports/websocket_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "test_results": tester.test_results,
                "messages_received": tester.messages_received
            }, f, indent=2)
        
        print(f"\n💾 WebSocket test results saved to: {results_file}")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"\n💥 Critical error during WebSocket testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))