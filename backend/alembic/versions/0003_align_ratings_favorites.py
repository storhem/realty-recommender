"""align ratings/favorites schema with models

Приводит схему БД в соответствие с ORM-моделями: переименовывает столбцы
временных меток (rated_at / added_at) и добавляет ограничения уникальности
пары «пользователь — объект» и диапазона оценки, описанные в пояснительной
записке (upsert оценки, защита от дублей в избранном).

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-06
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("ratings", "created_at", new_column_name="rated_at")
    op.alter_column("favorites", "created_at", new_column_name="added_at")

    op.create_unique_constraint(
        "uq_user_property_rating", "ratings", ["user_id", "property_id"]
    )
    op.create_check_constraint(
        "rating_score_range", "ratings", "score >= 1 AND score <= 5"
    )
    op.create_unique_constraint(
        "uq_user_property_favorite", "favorites", ["user_id", "property_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_user_property_favorite", "favorites", type_="unique")
    op.drop_constraint("rating_score_range", "ratings", type_="check")
    op.drop_constraint("uq_user_property_rating", "ratings", type_="unique")
    op.alter_column("favorites", "added_at", new_column_name="created_at")
    op.alter_column("ratings", "rated_at", new_column_name="created_at")
