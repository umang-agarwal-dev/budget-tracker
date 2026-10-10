from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


class InvalidGoogleTokenError(Exception):
    pass


def verify_google_token(token: str) -> dict:
    try:
        info = id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except (ValueError, GoogleAuthError) as exc:
        raise InvalidGoogleTokenError from exc

    if not info.get("email") or not info.get("email_verified"):
        raise InvalidGoogleTokenError
    return info