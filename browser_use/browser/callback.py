from fastapi import WebSocket
from typing import List

class BrowserStatusCallback:
    def __init__(self, active_connections: List[WebSocket]):
        self.active_connections = active_connections

    async def send_screenshot(self, screenshot_base64: str, window_index: int):
        try:
            for connection in self.active_connections:
                try:
                    await connection.send_json({
                        "type": "screenshot",
                        "window_index": window_index,
                        "screenshot": screenshot_base64
                    })
                except Exception as e:
                    print(f"Failed to send to connection: {e}")
        except Exception as e:
            print(f"Failed to send screenshot: {e}")