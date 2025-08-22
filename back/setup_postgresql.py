import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_databases():
    """Crear las bases de datos de PostgreSQL"""
    
    # Configuración de conexión con encoding UTF-8
    connection_params = {
        'host': 'xxxx',
        'port': 'xxxx',
        'user': 'xxxx',
        'password': 'xxxx',
        'client_encoding': 'xxxx'
    }
    
    databases = ['plusapp_db', 'plusapp_logs_db']
    
    try:
        # Conectar a PostgreSQL
        conn = psycopg2.connect(**connection_params)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        for db_name in databases:
            # Verificar si la base de datos existe
            cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
            exists = cursor.fetchone()
            
            if not exists:
                cursor.execute(f"CREATE DATABASE {db_name} WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE=template0")
                print(f"Base de datos '{db_name}' creada exitosamente")
            else:
                print(f"ℹBase de datos '{db_name}' ya existe")
        
        cursor.close()
        conn.close()
        print("\nConfiguración de PostgreSQL completada!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nAsegúrate de:")
        print("1. Tener PostgreSQL instalado y ejecutándose")
        print("2. Actualizar las credenciales en este archivo")
        print("3. Que el usuario tenga permisos para crear bases de datos")

if __name__ == '__main__':
    create_databases()