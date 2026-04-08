from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Модель базового ответа"""
    status: str
    message: str = ""
