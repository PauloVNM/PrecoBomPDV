// Responsabilidade: Comunicação isolada com o back-end para produtos.
const APIProducts = {
    fetchProduct: async function(barcode) {
        try {
            const response = await fetch(`/api/consulta-ean/${barcode}`);
            return await response.json();
        } catch (error) {
            console.error("Erro na consulta do EAN:", error);
            // Retorna um objeto formatado para não quebrar o UI caso o servidor caia
            return { success: false, message: "Erro de ligação com a API." };
        }
    }
};