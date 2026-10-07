// Responsabilidade: Gerenciar exclusivamente os dados da venda em memória e persistência.
const Cart = {
    items: [],

    load: function() {
        const savedSession = localStorage.getItem('pdv_cart_session');
        if (savedSession) {
            try {
                this.items = JSON.parse(savedSession);
            } catch (error) {
                console.error("Erro ao recuperar sessão do carrinho:", error);
                this.items = [];
            }
        }
    },

    save: function() {
        localStorage.setItem('pdv_cart_session', JSON.stringify(this.items));
    },
    
    add: function(product, barcode) {
        const existingItem = this.items.find(item => item.barcode === barcode);
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            this.items.push({
                barcode: barcode,
                brand: product.brand || "SEM MARCA",
                description: product.description,
                price: parseFloat(product.price),
                quantity: 1,
                total: parseFloat(product.price)
            });
        }
        this.save();
    },
    
    decrease: function(barcode) {
        const index = this.items.findIndex(item => item.barcode === barcode);
        
        if (index !== -1) {
            if (this.items[index].quantity > 1) {
                this.items[index].quantity -= 1;
                this.items[index].total = this.items[index].quantity * this.items[index].price;
            } else {
                this.items.splice(index, 1);
            }
            this.save();
        }
    },
    
    increase: function(barcode) {
        const index = this.items.findIndex(item => item.barcode === barcode);
        
        if (index !== -1) {
            this.items[index].quantity += 1;
            this.items[index].total = this.items[index].quantity * this.items[index].price;
            this.save();
        }
    },
    
    getTotal: function() {
        return this.items.reduce((acc, item) => acc + item.total, 0);
    },
    
    clear: function() {
        this.items = [];
        this.save();
    }
};