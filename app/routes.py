import requests
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from app.database import (
    get_all_products,
    get_product_by_barcode,
    insert_or_update_product,
    register_sale
)

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def menu():
    return render_template('menu.html')

@routes_bp.route('/venda')
def venda():
    return render_template('venda.html')

@routes_bp.route('/produtos')
def produtos_escolha():
    return render_template('produtos_escolha.html')

@routes_bp.route('/produtos/existentes')
def produtos_existentes():
    products_list = get_all_products()
    return render_template('produtos_existentes.html', products=products_list)

@routes_bp.route('/api/consulta-ean/<barcode>')
def consulta_ean(barcode):
    product = get_product_by_barcode(barcode)

    if product:
        return jsonify({
            "success": True,
            "origin": "local",
            "description": product['description'],
            "brand": product['brand'],
            "price": product['price']
        })

    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url, timeout=20)
        data = response.json()
        if data.get('status') == 1:
            p = data.get('product', {})
            return jsonify({
                "success": True,
                "origin": "cloud",
                "description": p.get('product_name_pt') or p.get('product_name') or "",
                "brand": p.get('brands', "")
            })
    except:
        pass
    
    return jsonify({"success": False, "origin": "none"})

@routes_bp.route('/salvar_produto_existente', methods=['POST'])
def salvar_produto_existente():
    barcode = request.form.get('barcode')
    description = request.form.get('description')
    brand = request.form.get('brand')
    price = request.form.get('price')
    
    if barcode and description and price and brand:
        insert_or_update_product(barcode, description, brand, price)
        
    return redirect(url_for('routes.produtos_existentes'))

@routes_bp.route('/api/salvar_venda', methods=['POST'])
def salvar_venda():
    data = request.get_json()
    items_raw = data.get('items', [])
    total_amount = data.get('total_amount', 0.0)
    
    if not items_raw:
        return jsonify({"success": False, "message": "Venda vazia."}), 400

    items_mapped = [{'barcode': i['barcode'], 'quantity': i['quantity']} for i in items_raw]

    success, result = register_sale(items_mapped, total_amount)
    
    if success:
        return jsonify({"success": True, "sale_id": result})
    else:
        return jsonify({"success": False, "message": result}), 500