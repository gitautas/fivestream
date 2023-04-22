from enum import Enum
import json
from typing import Any
import uuid
import random

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uvicorn


app = FastAPI()

CONNS = dict()
STREAMS = dict()

class EventType(Enum):
    UserList = 1
    AddStream = 2
    RemoveStream = 3
    Negotiate = 4
    Disconnect = 5

class Message(BaseModel):
    type: EventType
    message: Any

async def connect_user(user_id: str):
    user: WebSocket = CONNS[user_id]
    user.send_json(Message(type=EventType.Negotiate, message=""))
    resp = user.receive_json()

async def update_streams(websocket: WebSocket):
    if len(STREAMS) < 5:
        random_user_id = random.choice(list(CONNS.keys()))
        await connect_user(random_user_id)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    user_id = uuid.uuid4().hex
    CONNS[user_id] = websocket

    await websocket.send_json(Message(type=EventType.UserList, message=list(CONNS.keys())).json())

    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        del CONNS[user_id]

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=9009)
