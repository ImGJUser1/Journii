from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.auth import create_token
from app.utils.database import get_db
from bcrypt import hashpw, checkpw, gensalt

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == request.email).first()
        if not user or not checkpw(request.password.encode('utf-8'), user.password.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(user.id)
        return {"user_id": user.id, "token": token}
    except Exception as e:
        from app.utils.error_handling import handle_api_error
        handle_api_error(e)