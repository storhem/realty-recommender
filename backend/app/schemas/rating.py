from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    property_id: int
    score: int = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    id: int
    property_id: int
    score: int
    rated_at: datetime

    model_config = {"from_attributes": True}
