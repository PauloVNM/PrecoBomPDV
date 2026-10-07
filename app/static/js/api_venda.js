// Responsabilidade: Comunicação blindada com o back-end (Python)
const APISales = {
    fetchProductByBarcode: async function(barcode) {
        try {
            const response = await fetch(`/api/consulta-ean/${barcode}`);
            return await response.json();
        } catch (error) {
            console.error("Erro na consulta do EAN:", error);
            return { success: false, message: "Erro de ligação." };
        }
    },
    
    registerSale: async function(payload) {
        try {
            const response = await fetch('/api/salvar_venda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error("Erro ao guardar venda:", error);
            return { success: false, message: "Falha na rede ao guardar a venda." };
        }
    }
};