import pytest
import os
from pathlib import Path
from app.services.storage import LocalStorageService, InvalidStorageKeyError, StorageObjectNotFoundError

def test_storage_validation_and_traversal(tmp_path):
    storage = LocalStorageService(tmp_path)
    
    with pytest.raises(InvalidStorageKeyError):
        storage.save_temp("../traversal.jpg", b"")
        
    with pytest.raises(InvalidStorageKeyError):
        storage.save_temp("tmp_notauuid.jpg", b"")

    with pytest.raises(InvalidStorageKeyError):
        storage.save_temp("a"*32 + ".png", b"")

def test_atomic_finalize(tmp_path):
    storage = LocalStorageService(tmp_path)
    tmp_key = "tmp_" + "a"*32 + ".jpg"
    final_key = "a"*32 + ".jpg"
    
    storage.save_temp(tmp_key, b"content")
    assert (tmp_path / tmp_key).exists()
    
    storage.finalize(tmp_key, final_key)
    assert not (tmp_path / tmp_key).exists()
    assert (tmp_path / final_key).exists()

def test_delete(tmp_path):
    storage = LocalStorageService(tmp_path)
    final_key = "b"*32 + ".jpg"
    
    storage.save_temp("tmp_" + final_key, b"data")
    storage.finalize("tmp_" + final_key, final_key)
    
    assert (tmp_path / final_key).exists()
    storage.delete(final_key)
    assert not (tmp_path / final_key).exists()

def test_missing_object(tmp_path):
    storage = LocalStorageService(tmp_path)
    with pytest.raises(StorageObjectNotFoundError):
        storage.finalize("tmp_" + "c"*32 + ".jpg", "c"*32 + ".jpg")
