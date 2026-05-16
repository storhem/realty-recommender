from datetime import datetime
from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    property_id: int


class FavoriteResponse(BaseModel):
    id: int
    property_id: int
    added_at: datetime

    model_config = {"from_attributes": True}
