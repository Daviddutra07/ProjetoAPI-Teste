from sqlalchemy import create_engine

engine = create_engine(
    "mysql+pymysql://root:root@localhost/financas_db",
    echo=True
)
