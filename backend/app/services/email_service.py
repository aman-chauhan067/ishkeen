import uuid
import logging
from typing import Protocol
from datetime import datetime, timedelta, timezone
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_secure_token():
    return uuid.uuid4().hex + uuid.uuid4().hex

class EmailProvider(Protocol):
    def send_verification_email(self, to_email: str, token: str, verify_url: str):
        ...
        
    def send_password_reset_email(self, to_email: str, token: str, reset_url: str):
        ...
        
    def send_email_change_email(self, to_email: str, token: str, change_url: str):
        ...
        
    def send_transactional_email(self, to_email: str, subject: str, html_body: str):
        ...

class ConsoleEmailProvider(EmailProvider):
    def send_verification_email(self, to_email: str, token: str, verify_url: str):
        print(f"\n{'='*50}\n[EMAIL TO: {to_email}]\nSubject: Verify your Ishkeen Account\nLink: {verify_url}\n{'='*50}\n")
        
    def send_password_reset_email(self, to_email: str, token: str, reset_url: str):
        print(f"\n{'='*50}\n[EMAIL TO: {to_email}]\nSubject: Reset your Ishkeen Password\nLink: {reset_url}\n{'='*50}\n")

    def send_email_change_email(self, to_email: str, token: str, change_url: str):
        print(f"\n{'='*50}\n[EMAIL TO: {to_email}]\nSubject: Verify your new Email Address\nLink: {change_url}\n{'='*50}\n")
        
    def send_transactional_email(self, to_email: str, subject: str, html_body: str):
        print(f"\n{'='*50}\n[EMAIL TO: {to_email}]\nSubject: {subject}\nBody: {html_body[:100]}...\n{'='*50}\n")

class EmailDeliveryException(Exception):
    pass

class ResendEmailProvider(EmailProvider):
    def __init__(self):
        import resend
        self.resend = resend
        self.resend.api_key = settings.RESEND_API_KEY
        self.from_email = settings.EMAIL_FROM
        
    def _send_email(self, to_email: str, subject: str, html_content: str):
        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            self.resend.Emails.send(params)
            logger.info(f"Email sent to {to_email} via Resend")
        except Exception as e:
            logger.error(f"Failed to send email via Resend to {to_email}: {str(e)}")
            raise EmailDeliveryException(str(e))

    def send_verification_email(self, to_email: str, token: str, verify_url: str):
        subject = "Verify your Ishkeen account"
        html = f"""
        <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
            <h2>Welcome to Ishkeen!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="{verify_url}" style="display: inline-block; padding: 12px 24px; background-color: #253A4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{verify_url}">{verify_url}</a></p>
            <p>This link will expire in 24 hours.</p>
        </div>
        """
        self._send_email(to_email, subject, html)
        
    def send_password_reset_email(self, to_email: str, token: str, reset_url: str):
        subject = "Reset your Ishkeen password"
        html = f"""
        <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password. Click the link below to choose a new one:</p>
            <p><a href="{reset_url}" style="display: inline-block; padding: 12px 24px; background-color: #253A4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_email_change_email(self, to_email: str, token: str, change_url: str):
        subject = "Verify your new Email Address"
        html = f"""
        <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
            <h2>Confirm Email Change</h2>
            <p>Please confirm your new email address by clicking the link below:</p>
            <p><a href="{change_url}" style="display: inline-block; padding: 12px 24px; background-color: #253A4A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm Email</a></p>
            <p>This link will expire in 24 hours.</p>
        </div>
        """
        self._send_email(to_email, subject, html)
        
    def send_transactional_email(self, to_email: str, subject: str, html_body: str):
        self._send_email(to_email, subject, html_body)

def get_email_provider() -> EmailProvider:
    provider = settings.EMAIL_PROVIDER.lower()
    if provider == "resend":
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY is not set. Falling back to ConsoleEmailProvider.")
            return ConsoleEmailProvider()
        return ResendEmailProvider()
    return ConsoleEmailProvider()

class EmailService:
    def __init__(self, provider: EmailProvider = None):
        self.provider = provider or get_email_provider()
        
    def send_verification_email(self, to_email: str, token: str, verify_url: str):
        self.provider.send_verification_email(to_email, token, verify_url)
        
    def send_password_reset_email(self, to_email: str, token: str, reset_url: str):
        self.provider.send_password_reset_email(to_email, token, reset_url)

    def send_email_change_email(self, to_email: str, token: str, change_url: str):
        self.provider.send_email_change_email(to_email, token, change_url)
        
    def send_transactional_email(self, to_email: str, subject: str, html_body: str):
        self.provider.send_transactional_email(to_email, subject, html_body)

email_service = EmailService()

