from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.product import Product as DBProduct

def get_product(db: Session, category: str, budget: str = "mid_range") -> Optional[DBProduct]:
    # Fetch all products in category, ordering starred products first
    query = db.query(DBProduct).filter(DBProduct.category == category).order_by(desc(DBProduct.is_starred))
    products = query.all()
    
    if not products:
        return None
        
    # We don't have price_tier in DB yet, so we just return the most highly prioritized one.
    # The order_by(desc(is_starred)) ensures starred items come first.
    return products[0]
