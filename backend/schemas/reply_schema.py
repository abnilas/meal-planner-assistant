from pydantic import BaseModel

class UserMessage(BaseModel):
    sessionId: str
    message: str