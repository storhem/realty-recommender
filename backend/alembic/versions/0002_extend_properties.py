"""extend properties and add saved searches

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-02
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("floor", sa.Integer(), nullable=True))
    op.add_column("properties", sa.Column("total_floors", sa.Integer(), nullable=True))
    op.add_column("properties", sa.Column("year_built", sa.Integer(), nullable=True))
    op.add_column("properties", sa.Column("renovation", sa.String(50), nullable=True))
    op.add_column(
        "properties",
        sa.Column("deal_type", sa.String(20), nullable=False, server_default="sale"),
    )
    op.add_column(
        "properties",
        sa.Column(
            "owner_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("properties", sa.Column("seller_name", sa.String(100), nullable=True))
    op.add_column("properties", sa.Column("seller_phone", sa.String(20), nullable=True))

    op.create_index("ix_properties_type", "properties", ["type"])
    op.create_index("ix_properties_deal_type", "properties", ["deal_type"])

    op.create_table(
        "saved_searches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("params", sa.JSON(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "last_seen_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_saved_searches_user_id", "saved_searches", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_saved_searches_user_id", table_name="saved_searches")
    op.drop_table("saved_searches")
    op.drop_index("ix_properties_deal_type", table_name="properties")
    op.drop_index("ix_properties_type", table_name="properties")
    for col in (
        "seller_phone",
        "seller_name",
        "owner_id",
        "deal_type",
        "renovation",
        "year_built",
        "total_floors",
        "floor",
    ):
        op.drop_column("properties", col)
