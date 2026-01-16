import os
import django
from django.db.utils import IntegrityError

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
    password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

    if not email or not password:
        print("Skipping superuser creation: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set.")
        return

    if User.objects.filter(email=email).exists():
        print(f"Superuser {email} already exists.")
    else:
        try:
            # Create the superuser
            # Depending on your CustomUser model, 'username' might be required or not.
            # Assuming 'email' is the USERNAME_FIELD based on typical custom setups or we set a dummy username.
            # Looking at your settings.py: AUTH_USER_MODEL = 'main_app.CustomUser'
            # Let's assume username is the email or not needed if email is USERNAME_FIELD.
            # We will try create_superuser with email and password first.
            
            # Note: The createsuperuser command usually prompts for fields. 
            # Programmatically we use the manager method.
            
            u = User.objects.create_superuser(
                email=email,
                password=password
            )
            print(f"Superuser {email} created successfully.")
        except IntegrityError:
            print(f"Superuser {email} already exists (IntegrityError).")
        except Exception as e:
            print(f"Error creating superuser: {e}")

if __name__ == "__main__":
    create_superuser()
