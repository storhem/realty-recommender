from datetime import datetime

from pydantic import BaseModel, Field


class SavedSearchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    params: dict


class SavedSearchResponse(BaseModel):
    id: int
    name: str
    params: dict
    created_at: datetime
    last_seen_at: datetime
    new_count: int = 0

    model_config = {"from_attributes": True}
