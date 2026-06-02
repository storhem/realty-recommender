from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DealType(str, Enum):
    sale = "sale"
    rent = "rent"


class Renovation(str, Enum):
    none = "none"
    cosmetic = "cosmetic"
    euro = "euro"
    designer = "designer"


class SortBy(str, Enum):
    created_desc = "created_desc"
    price_asc = "price_asc"
    price_desc = "price_desc"
    area_desc = "area_desc"
    area_asc = "area_asc"
    price_per_m_asc = "price_per_m_asc"
    distance_asc = "distance_asc"


class PropertyCreate(BaseModel):
    title: str
    type: str = Field(pattern="^(apartment|house|studio|room|commercial)$")
    price: float = Field(gt=0)
    area: float = Field(gt=0)
    rooms: int = Field(ge=0)
    address: str
    description: str | None = None
    photos: list[str] = []
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    floor: int | None = Field(default=None, ge=0)
    total_floors: int | None = Field(default=None, ge=0)
    year_built: int | None = Field(default=None, ge=1800, le=2100)
    renovation: Renovation | None = None
    deal_type: DealType = DealType.sale
    seller_name: str | None = None
    seller_phone: str | None = None


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
    floor: int | None = None
    total_floors: int | None = None
    year_built: int | None = None
    renovation: str | None = None
    deal_type: str = "sale"
    seller_name: str | None = None
    seller_phone: str | None = None
    owner_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyGeoResponse(PropertyResponse):
    distance_m: float


class GeoSearchParams(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    radius: float = Field(gt=0, le=300000, description="Радиус поиска в метрах")


class PropertyFilter(BaseModel):
    type: str | None = None
    price_min: float | None = None
    price_max: float | None = None
    rooms: int | None = None
    area_min: float | None = None
