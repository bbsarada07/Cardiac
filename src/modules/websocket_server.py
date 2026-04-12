import asyncio
import json
import threading
import websockets

class CardiacWebSocketServer:
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.connected_clients = set()
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self.start_loop, daemon=True)
        self.thread.start()
        self.on_command = None

    def set_command_callback(self, callback):
        self.on_command = callback

    def start_loop(self):
        asyncio.set_event_loop(self.loop)
        
        async def main():
            async with websockets.serve(self._handler, self.host, self.port):
                print(f"WebSocket server started on ws://{self.host}:{self.port}")
                await asyncio.Future()  # run forever
                
        try:
            self.loop.run_until_complete(main())
        except Exception as e:
            print(f"Failed to start WebSocket server: {e}")

    async def _handler(self, websocket, path):
        self.connected_clients.add(websocket)
        print(f"New mobile client connected: {websocket.remote_address}")
        try:
            async for message in websocket:
                # We can handle incoming commands here (e.g. "dismiss_alert", "exercise_mode_toggle")
                try:
                    data = json.loads(message)
                    if 'command' in data and self.on_command:
                        if data['command'] == 'ping':
                            await websocket.send(json.dumps({"type": "PONG", "payload": {}}))
                        else:
                            print(f"Received command from mobile: {data['command']}")
                            self.on_command(data['command'], data.get('payload', {}))
                    elif 'action' in data:
                        print(f"Received legacy action from mobile: {data['action']}")
                except Exception as e:
                    print(f"WS Command Error: {e}")
                    pass
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.connected_clients.remove(websocket)
            print(f"Mobile client disconnected: {websocket.remote_address}")

    def broadcast_state(self, state_dict):
        """Called by main thread to send data to all connected websockets"""
        if not self.connected_clients:
            return
            
        def clean_value(val):
            # Convert NaN to None for JSON compliance
            import math
            import numbers
            if isinstance(val, numbers.Number):
                if math.isnan(val) or math.isinf(val):
                    return None
            return val

        # Clean the dict minimally for JSON serialization
        clean_state = {}
        for k, v in state_dict.items():
            if isinstance(v, dict):
                clean_state[k] = {ik: clean_value(iv) for ik, iv in v.items()}
            elif isinstance(v, list) or isinstance(v, tuple):
                if k == 'ode_raw' and len(v) == 2:
                    # Specific handler for the tuple
                    clean_state[k] = [
                        [clean_value(x) for x in v[0]], 
                        [clean_value(x) for x in v[1]]
                    ]
                else:
                    try:
                        clean_state[k] = [clean_value(i) for i in v]
                    except:
                        clean_state[k] = list(v)
            else:
                clean_state[k] = clean_value(v)
        
        message = json.dumps({"type": "STATE_UPDATE", "payload": clean_state})
        
        async def _send_all():
            if self.connected_clients:
                await asyncio.gather(
                    *[client.send(message) for client in self.connected_clients],
                    return_exceptions=True
                )
        
        # Dispatch to the event loop securely
        asyncio.run_coroutine_threadsafe(_send_all(), self.loop)
