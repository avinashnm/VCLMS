import psycopg2
import os

db_url = "postgresql://vclms_db_new_user:uFJExHNELqv1uNXw2PosbCafhsuy2zpD@dpg-d6hf0jh5pdvs73dgvqa0-a.singapore-postgres.render.com/vclms_db_new"

try:
    conn = psycopg2.connect(
        db_url, 
        sslmode='require',
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5
    )
    print("Connection successful with keepalives!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
