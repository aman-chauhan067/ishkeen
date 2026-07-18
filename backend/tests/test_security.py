from app.core.security import get_password_hash, verify_password, generate_session_token, hash_session_token

def test_password_hashing():
    password = "SuperSecurePassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert "$" in hashed  # Argon2id format
    
    # Verify correct password
    is_valid, new_hash = verify_password(password, hashed)
    assert is_valid is True
    assert new_hash is None

    # Verify wrong password
    is_valid, new_hash = verify_password("WrongPassword123", hashed)
    assert is_valid is False

def test_session_tokens():
    token = generate_session_token()
    assert len(token) > 32  # High entropy
    
    hashed = hash_session_token(token)
    assert hashed != token
    assert len(hashed) == 64  # SHA-256 hexdigest
    
    # Deterministic
    assert hash_session_token(token) == hashed
    
    # Different tokens have different hashes
    token2 = generate_session_token()
    assert hash_session_token(token2) != hashed
