import json
import os
from pydantic import BaseModel, ConfigDict
from typing import List, Dict

class ConcernMapping(BaseModel):
    concern: str
    candidate_categories: List[str]

class CategoryMetadata(BaseModel):
    photosensitizing: bool
    irritation_potential: str # "low", "moderate", "high"
    conflicts: List[str]

class KnowledgeBaseSchema(BaseModel):
    version: str
    mappings: List[ConcernMapping]
    category_metadata: Dict[str, CategoryMetadata]
    
    model_config = ConfigDict(extra="forbid")

class KnowledgeBase:
    def __init__(self, data: dict):
        self._schema = KnowledgeBaseSchema(**data)
        self.version = self._schema.version
        
        # Verify duplicate concerns
        concerns = [m.concern for m in self._schema.mappings]
        if len(concerns) != len(set(concerns)):
            raise ValueError("Duplicate concerns found in knowledge base mappings")
            
        self._concern_map = {m.concern: m.candidate_categories for m in self._schema.mappings}
        self.metadata = self._schema.category_metadata
        
    def get_candidates_for_concern(self, concern: str) -> List[str]:
        return self._concern_map.get(concern, [])
        
    def get_metadata(self, category: str) -> CategoryMetadata:
        return self.metadata.get(category)
        
    @classmethod
    def load_from_file(cls, filepath: str) -> "KnowledgeBase":
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(data)

def get_default_knowledge_base() -> KnowledgeBase:
    current_dir = os.path.dirname(__file__)
    filepath = os.path.join(current_dir, "knowledge_base_v1.json")
    return KnowledgeBase.load_from_file(filepath)
