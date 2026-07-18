import os
import re
from pathlib import Path
from typing import Protocol, BinaryIO
from app.core.config import UPLOAD_PATH

class StorageError(Exception):
    pass

class InvalidStorageKeyError(StorageError):
    pass

class StorageObjectNotFoundError(StorageError):
    pass

class StorageWriteError(StorageError):
    pass

class ImageStorageProtocol(Protocol):
    def save_temp(self, key: str, data: bytes) -> None:
        ...

    def finalize(self, temp_key: str, final_key: str) -> None:
        ...

    def delete(self, key: str) -> None:
        ...

    def get_stream(self, key: str) -> BinaryIO:
        ...

class LocalStorageService:
    def __init__(self, upload_dir: Path = UPLOAD_PATH):
        self.upload_dir = upload_dir.resolve()
        
    def _validate_and_resolve(self, key: str) -> Path:
        if not re.match(r'^(tmp_)?[a-f0-9]{32}\.jpg$', key):
            raise InvalidStorageKeyError(f"Invalid storage key format: {key}")
            
        resolved_path = (self.upload_dir / key).resolve()
        if resolved_path.parent != self.upload_dir:
            raise InvalidStorageKeyError("Path traversal attempt detected")
            
        return resolved_path

    def save_temp(self, key: str, data: bytes) -> None:
        try:
            path = self._validate_and_resolve(key)
            with open(path, "wb") as f:
                f.write(data)
        except InvalidStorageKeyError:
            raise
        except Exception as e:
            raise StorageWriteError(f"Failed to write temporary file: {e}")

    def finalize(self, temp_key: str, final_key: str) -> None:
        try:
            temp_path = self._validate_and_resolve(temp_key)
            final_path = self._validate_and_resolve(final_key)
            if not temp_path.exists():
                raise StorageObjectNotFoundError(f"Temp file {temp_key} not found for finalization")
            os.replace(temp_path, final_path)
        except (InvalidStorageKeyError, StorageObjectNotFoundError):
            raise
        except Exception as e:
            # Attempt to clean up temp file if rename fails
            try:
                if temp_path.exists():
                    os.remove(temp_path)
            except Exception:
                pass
            raise StorageWriteError(f"Failed to finalize file: {e}")

    def delete(self, key: str) -> None:
        try:
            path = self._validate_and_resolve(key)
            if path.exists():
                os.remove(path)
        except InvalidStorageKeyError:
            raise
        except Exception as e:
            raise StorageWriteError(f"Failed to delete file: {e}")

    def get_stream(self, key: str) -> BinaryIO:
        try:
            path = self._validate_and_resolve(key)
            if not path.exists():
                raise StorageObjectNotFoundError(f"Object not found: {key}")
            return open(path, "rb")
        except (InvalidStorageKeyError, StorageObjectNotFoundError):
            raise
        except Exception as e:
            raise StorageError(f"Failed to open file stream: {e}")
