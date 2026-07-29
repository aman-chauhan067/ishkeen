from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product

PRODUCT_DB = [
    # Cleansers
    {"name": "Hydrating Cleanser", "brand": "Cerave", "category": "hydrating_cleanser", "is_starred": True, "description": "Gentle, non-foaming."},
    {"name": "Squalane Cleanser", "brand": "The Ordinary", "category": "gentle_cleanser", "is_starred": True, "description": "Gentle makeup removing."},
    {"name": "Salicylic Acid Cleanser", "brand": "The INKEY List", "category": "foaming_cleanser", "is_starred": True, "description": "Unclogs pores."},
    {"name": "Oat Cleansing Balm", "brand": "The INKEY List", "category": "cleansing_balm", "is_starred": True, "description": "Melts makeup."},
    
    # Moisturizers
    {"name": "Daily Moisturizing Lotion", "brand": "Cerave", "category": "barrier_moisturizer", "is_starred": True, "description": "Lightweight hydration."},
    {"name": "Water Gel", "brand": "Neutrogena", "category": "gel_moisturizer", "is_starred": True, "description": "Refreshing gel."},
    {"name": "Rich Cream", "brand": "Augustinus Bader", "category": "rich_night_cream", "is_starred": True, "description": "Ultra-hydrating."},
    
    # Sunscreens
    {"name": "Anthelios Melt-in Milk SPF 60", "brand": "La Roche-Posay", "category": "broad_spectrum_spf", "is_starred": True, "description": "High protection."},
    
    # Actives
    {"name": "Vitamin C Suspension 23%", "brand": "The Ordinary", "category": "vitamin_c", "is_starred": True, "description": "Brightens tone."},
    {"name": "BHA Liquid Exfoliant 2%", "brand": "Paula's Choice", "category": "bha_salicylic_acid", "is_starred": True, "description": "Unclogs pores."},
    {"name": "Retinol 0.2% in Squalane", "brand": "The Ordinary", "category": "retinoid_type", "is_starred": True, "description": "Low-strength retinol."},
    {"name": "10% Azelaic Acid Booster", "brand": "Paula's Choice", "category": "azelaic_acid", "is_starred": True, "description": "Soothes redness."},
    {"name": "Glycolic Acid 7% Toning Solution", "brand": "The Ordinary", "category": "aha_glycolic_lactic_acid", "is_starred": True, "description": "Mild exfoliation."}
]

def seed_products():
    db: Session = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            print("Products already seeded.")
            return
            
        for p in PRODUCT_DB:
            prod = Product(
                name=p["name"],
                brand=p["brand"],
                category=p["category"],
                is_starred=p["is_starred"],
                usage_instructions=p["description"]
            )
            db.add(prod)
        db.commit()
        print("Products seeded successfully.")
    except Exception as e:
        print(f"Error seeding products: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()
