"""
Rate limiting configuration
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance that can be imported across the app
limiter = Limiter(key_func=get_remote_address)
