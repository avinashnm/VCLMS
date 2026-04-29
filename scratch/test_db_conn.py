import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vclms.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        row = cursor.fetchone()
        print(f"Database connection successful: {row}")
except Exception as e:
    print(f"Database connection failed: {e}")
