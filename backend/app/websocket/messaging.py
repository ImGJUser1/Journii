from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, Set
import json
import asyncio
from datetime import datetime

from app.core.security import decode_token
from app.db.session import get_db
from app.models.messaging import Conversation, Message, ConversationParticipant
from app.models.user import User
from app.core.logging import get_logger

logger = get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map of user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Map of conversation_id -> Set of user_ids
        self.conversation_participants: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket")
        
        # Remove from all conversations
        for conv_id, participants in self.conversation_participants.items():
            participants.discard(user_id)
    
    async def join_conversation(self, user_id: str, conversation_id: str):
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        self.conversation_participants[conversation_id].add(user_id)
        logger.info(f"User {user_id} joined conversation {conversation_id}")
    
    def leave_conversation(self, user_id: str, conversation_id: str):
        if conversation_id in self.conversation_participants:
            self.conversation_participants[conversation_id].discard(user_id)
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {user_id}: {e}")
    
    async def broadcast_to_conversation(self, conversation_id: str, message: dict, exclude_user: str = None):
        if conversation_id in self.conversation_participants:
            for user_id in self.conversation_participants[conversation_id]:
                if user_id != exclude_user:
                    await self.send_to_user(user_id, message)

manager = ConnectionManager()

async def messaging_websocket(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time messaging
    """
    # Authenticate
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        await websocket.close(code=4001, reason="User not found or inactive")
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            action = message_data.get("action")
            
            if action == "join_conversation":
                conversation_id = message_data.get("conversation_id")
                # Verify user is participant
                participant = db.query(ConversationParticipant).filter(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == user_id
                ).first()
                
                if participant:
                    await manager.join_conversation(user_id, conversation_id)
                    await websocket.send_json({
                        "type": "joined",
                        "conversation_id": conversation_id
                    })
            
            elif action == "send_message":
                conversation_id = message_data.get("conversation_id")
                content = message_data.get("content")
                message_type = message_data.get("message_type", "text")
                
                # Create message in database
                message = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    message_type=message_type,
                    content=content
                )
                db.add(message)
                
                # Update conversation
                conversation = db.query(Conversation).filter(
                    Conversation.id == conversation_id
                ).first()
                
                if conversation:
                    conversation.last_message_at = datetime.utcnow()
                    conversation.last_message_preview = content[:200]
                    conversation.last_message_sender_id = user_id
                
                db.commit()
                
                # Broadcast to conversation
                await manager.broadcast_to_conversation(
                    conversation_id,
                    {
                        "type": "new_message",
                        "message": {
                            "id": str(message.id),
                            "sender_id": user_id,
                            "sender_name": user.full_name,
                            "content": content,
                            "message_type": message_type,
                            "created_at": message.created_at.isoformat()
                        }
                    },
                    exclude_user=user_id
                )
                
                # Confirm to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message_id": str(message.id)
                })
            
            elif action == "typing":
                conversation_id = message_data.get("conversation_id")
                await manager.broadcast_to_conversation(
                    conversation_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "user_name": user.full_name
                    },
                    exclude_user=user_id
                )
            
            elif action == "mark_read":
                message_id = message_data.get("message_id")
                message = db.query(Message).filter(Message.id == message_id).first()
                if message and user_id not in message.read_by:
                    message.read_by.append(user_id)
                    db.commit()
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)