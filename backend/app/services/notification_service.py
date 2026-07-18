from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType

class NotificationService:
    @staticmethod
    def dispatch(db: Session, notification_type: NotificationType, title: str, message: str, link: str = None) -> Notification:
        """
        Creates and persists a new notification in the database.
        """
        notification = Notification(
            type=notification_type,
            title=title,
            message=message,
            link=link
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
