import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE = os.path.join(BASE_DIR, 'data', 'mercado.db')

def get_db_connection():
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS products (
                barcode TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                brand TEXT,
                price REAL NOT NULL
            )
        ''')

        conn.execute('''
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_amount REAL NOT NULL
            )
        ''')

        conn.execute('''
            CREATE TABLE IF NOT EXISTS sold_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                barcode TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales (id),
                FOREIGN KEY (barcode) REFERENCES products (barcode)
            )
        ''')
        conn.commit()

def get_all_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return [dict(row) for row in products]

def get_product_by_barcode(barcode):
    conn = get_db_connection()
    barcode_str = str(barcode) # Proteção adicional para garantir texto no binding
    product = conn.execute('SELECT * FROM products WHERE barcode = ?', (barcode_str,)).fetchone()
    conn.close()
    return dict(product) if product else None

def insert_or_update_product(barcode, description, brand, price):
    conn = get_db_connection()
    barcode_str = str(barcode) # Proteção adicional
    conn.execute(
        'INSERT OR REPLACE INTO products (barcode, description, brand, price) VALUES (?, ?, ?, ?)',
        (barcode_str, description, brand, price)
    )
    conn.commit()
    conn.close()

def register_sale(items, total_amount):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute(
            'INSERT INTO sales (total_amount) VALUES (?)',
            (total_amount,)
        )
        sale_id = cursor.lastrowid 

        for item in items:
            cursor.execute(
                'INSERT INTO sold_items (sale_id, barcode, quantity) VALUES (?, ?, ?)',
                (sale_id, item['barcode'], item['quantity'])
            )
        
        conn.commit() 
        return True, sale_id
        
    except Exception as e:
        conn.rollback() 
        return False, str(e)
    finally:
        conn.close()