from typing import List, Optional
from pydantic import BaseModel

class Product(BaseModel):
    name: str
    brand: str
    price_tier: str
    category: str
    description: str

PRODUCT_DB = [
    # Cleansers
    Product(name="Hydrating Cleanser", brand="Cerave", price_tier="budget", category="hydrating_cleanser", description="Gentle, non-foaming."),
    Product(name="Squalane Cleanser", brand="The Ordinary", price_tier="budget", category="gentle_cleanser", description="Gentle makeup removing."),
    Product(name="Salicylic Acid Cleanser", brand="The INKEY List", price_tier="budget", category="foaming_cleanser", description="Unclogs pores."),
    
    Product(name="Toleriane Hydrating Gentle Cleanser", brand="La Roche-Posay", price_tier="mid_range", category="hydrating_cleanser", description="Milky cream."),
    Product(name="Soy Face Cleanser", brand="Fresh", price_tier="luxury", category="gentle_cleanser", description="pH-balanced."),
    
    Product(name="Oat Cleansing Balm", brand="The INKEY List", price_tier="budget", category="cleansing_balm", description="Melts makeup."),
    Product(name="Take The Day Off", brand="Clinique", price_tier="mid_range", category="cleansing_balm", description="Silky balm."),
    
    # Moisturizers
    Product(name="Daily Moisturizing Lotion", brand="Cerave", price_tier="budget", category="barrier_moisturizer", description="Lightweight hydration."),
    Product(name="Natural Moisturizing Factors + HA", brand="The Ordinary", price_tier="budget", category="barrier_moisturizer", description="Non-greasy."),
    Product(name="Omega+ Complex Moisturizer", brand="Paula's Choice", price_tier="mid_range", category="barrier_moisturizer", description="Nourishing."),
    Product(name="Protini Polypeptide Cream", brand="Drunk Elephant", price_tier="luxury", category="barrier_moisturizer", description="Protein-rich."),
    Product(name="Water Gel", brand="Neutrogena", price_tier="budget", category="gel_moisturizer", description="Refreshing gel."),
    Product(name="Rich Cream", brand="Augustinus Bader", price_tier="luxury", category="rich_night_cream", description="Ultra-hydrating."),
    
    # Sunscreens
    Product(name="Anthelios Melt-in Milk SPF 60", brand="La Roche-Posay", price_tier="mid_range", category="broad_spectrum_spf", description="High protection."),
    Product(name="Unseen Sunscreen SPF 40", brand="Supergoop!", price_tier="mid_range", category="broad_spectrum_spf", description="Invisible finish."),
    Product(name="Daily UV Defense SPF 36", brand="Innisfree", price_tier="budget", category="broad_spectrum_spf", description="Water-light."),
    
    # Actives
    Product(name="Vitamin C Suspension 23%", brand="The Ordinary", price_tier="budget", category="vitamin_c", description="Brightens tone."),
    Product(name="C E Ferulic", brand="SkinCeuticals", price_tier="luxury", category="vitamin_c", description="Gold standard antioxidant."),
    Product(name="BHA Liquid Exfoliant 2%", brand="Paula's Choice", price_tier="mid_range", category="bha_salicylic_acid", description="Unclogs pores."),
    Product(name="Retinol 0.2% in Squalane", brand="The Ordinary", price_tier="budget", category="retinoid_type", description="Low-strength retinol."),
    Product(name="A-Passioni Retinol Cream", brand="Drunk Elephant", price_tier="luxury", category="retinoid_type", description="1% vegan retinol."),
    Product(name="10% Azelaic Acid Booster", brand="Paula's Choice", price_tier="mid_range", category="azelaic_acid", description="Soothes redness."),
    Product(name="Glycolic Acid 7% Toning Solution", brand="The Ordinary", price_tier="budget", category="aha_glycolic_lactic_acid", description="Mild exfoliation.")
]

def get_product(category: str, budget: str) -> Optional[Product]:
    # Fallback cascade: requested budget -> mid_range -> budget
    candidates = [p for p in PRODUCT_DB if p.category == category]
    if not candidates:
        return None
        
    exact_match = [p for p in candidates if p.price_tier == budget]
    if exact_match:
        return exact_match[0]
        
    # Fallback to any available if exact budget tier not found
    mid_range = [p for p in candidates if p.price_tier == "mid_range"]
    if mid_range: return mid_range[0]
    
    budget_items = [p for p in candidates if p.price_tier == "budget"]
    if budget_items: return budget_items[0]
    
    return candidates[0]
