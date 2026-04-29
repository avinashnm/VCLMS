import psycopg2
import os

db_url = "postgresql://vclms_db_new_user:uFJExHNELqv1uNXw2PosbCafhsuy2zpD@dpg-d6hf0jh5pdvs73dgvqa0-a.singapore-postgres.render.com/vclms_db_new"

try:
    conn = psycopg2.connect(db_url, sslmode='require')
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
