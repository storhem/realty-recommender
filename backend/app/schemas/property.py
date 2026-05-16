from datetime import datetime
from pydantic import BaseModel, Field


class PropertyCreate(BaseModel):
    title: str
    type: str = Field(pattern="^(apartment|house|studio|commercial)$")
    price: float = Field(gt=0)
    area: float = Field(gt=0)
    rooms: int = Field(ge=0)
    address: str
    description: str | None = None
    photos: list[str] = []
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class PropertyResponse(BaseModel):
    id: int
    title: str
    type: str
    price: float
    area: float
    rooms: int
    address: str
    description: str | None
    photos: list[str]
    latitude: float
    longitude: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyGeoResponse(PropertyResponse):
    distance_m: float


class GeoSearchParams(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    radius: float = Field(gt=0, le=50000, description="Радиус поиска в метрах")


class PropertyFilter(BaseModel):
    type: str | None = None
    price_min: float | None = None
    price_max: float | None = None
    rooms: int | None = None
    area_min: float | None = None
