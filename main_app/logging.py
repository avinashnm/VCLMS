import logging
from django.contrib.auth.signals import user_logged_in

logger = logging.getLogger('user_activity')

def log_user_login(sender, request, user, **kwargs):
    logger.info(f"{user.username} logged in from {request.META.get('REMOTE_ADDR')}")

user_logged_in.connect(log_user_login)
