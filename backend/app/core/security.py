import secrets
import hashlib
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

# Initialize pwdlib with Argon2id hasher
password_hash = PasswordHash((Argon2Hasher(),))

def verify_password(plain_password: str, hashed_password: str) -> tuple[bool, str | None]:
    """
    Verifies a plaintext password against the hashed password.
    Supports Unicode implicitly since pwdlib/argon2-cffi handles utf-8 encoding.
    Returns a tuple of (is_valid, new_hash).
    If new_hash is not None, the password hash parameters have changed and the DB should be updated.
    """
    return password_hash.verify_and_update(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a password using the configured Argon2id parameters.
    """
    return password_hash.hash(password)

def generate_session_token() -> str:
    """
    Generates a high-entropy, cryptographically secure random session token.
    Uses 32 bytes of entropy encoded as url-safe base64 (~43 characters).
    """
    return secrets.token_urlsafe(32)

def hash_session_token(token: str) -> str:
    """
    Deterministic, fast cryptographic hash (SHA-256) of the session token.
    We NEVER store the raw session token in the database, only this hash.
    Since the input token is high-entropy (cryptographically random),
    a fast hash like SHA-256 is appropriate and prevents side-channel/timing attacks
    better than a slow hash like Argon2id.
    """
    # hashlib.sha256 requires bytes, so encode the token
    return hashlib.sha256(token.encode('utf-8')).hexdigest()
