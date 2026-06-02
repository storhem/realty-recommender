from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    area: Mapped[float] = mapped_column(Float, nullable=False)
    rooms: Mapped[int] = mapped_column(Integer, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photos: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    location: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )

    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_built: Mapped[int | None] = mapped_column(Integer, nullable=True)
    renovation: Mapped[str | None] = mapped_column(String(50), nullable=True)
    deal_type: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="sale", index=True
    )

    owner_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    seller_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    seller_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    views: Mapped[list["View"]] = relationship(back_populates="property")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="property")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="property")
