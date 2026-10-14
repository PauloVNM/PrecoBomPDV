// Responsabilidade: Controlar o DOM, concatenar descrição fracionada e orquestrar módulos de API e Precificação
document.addEventListener('DOMContentLoaded', () => {
    const domElements = {
        barcode: document.getElementById('barcode'),
        baseDescription: document.getElementById('base_description'),
        measureValue: document.getElementById('measure_value'),
        measureUnit: document.getElementById('measure_unit'),
        finalDescription: document.getElementById('final_description'),
        brand: document.getElementById('brand'),
        profitMargin: document.getElementById('profit_margin'),
        costReals: document.getElementById('cost_reals'),
        costCents: document.getElementById('cost_cents'),
        saleReals: document.getElementById('sale_reals'),
        saleCents: document.getElementById('sale_cents'),
        finalPrice: document.getElementById('final_price')
    };
    
    const statusLabel = document.getElementById('status_barcode');
    const formRegistration = document.getElementById('form-registration');

    // FUNÇÃO UTILITÁRIA: Sanitização focada em padronização para BI
    function sanitizeString(str) {
        if (!str) return "";
        return str.toString().trim().toUpperCase().replace(/\s+/g, ' ');
    }

    // 1. Setup inicial da margem
    const savedMargin = localStorage.getItem('market_default_margin');
    if (savedMargin) domElements.profitMargin.value = savedMargin;

    // 2. Controladores de Tela
    function updateSalePriceUI(reals, cents) {
        domElements.saleReals.value = reals;
        domElements.saleCents.value = cents;
        updateHiddenPriceUI();
    }

    function updateHiddenPriceUI() {
        domElements.finalPrice.value = Precificacao.obterPrecoFinalOculto(
            domElements.saleReals.value,
            domElements.saleCents.value
        );
    }

    function updateFinalDescription() {
        const base = sanitizeString(domElements.baseDescription.value);
        const val = sanitizeString(domElements.measureValue.value); 
        const unit = domElements.measureUnit.value.trim().toUpperCase();
        
        if (base && val) {
            domElements.finalDescription.value = `${base} ${val}${unit}`;
        } else if (base) {
            domElements.finalDescription.value = base;
        } else {
            domElements.finalDescription.value = "";
        }
    }

    function executeFinancialCalculation() {
        const margin = parseFloat(domElements.profitMargin.value) || 0;
        const costReals = parseFloat(domElements.costReals.value) || 0;
        const result = Precificacao.calcularVenda(margin, costReals, domElements.costCents.value);
        
        if (result) {
            updateSalePriceUI(result.reais, result.centavos);
        } else {
            updateHiddenPriceUI();
        }
    }

    // 3. Ouvintes de Eventos de Composição (Concatenação)
    domElements.baseDescription.addEventListener('input', updateFinalDescription);
    domElements.measureValue.addEventListener('input', updateFinalDescription);
    domElements.measureUnit.addEventListener('change', updateFinalDescription);

    // 4. Ouvintes de Cálculo Financeiro
    domElements.profitMargin.addEventListener('input', executeFinancialCalculation);
    domElements.costReals.addEventListener('input', executeFinancialCalculation);
    domElements.costCents.addEventListener('input', executeFinancialCalculation);
    domElements.saleReals.addEventListener('input', updateHiddenPriceUI);
    domElements.saleCents.addEventListener('input', updateHiddenPriceUI);

// 5. Ouvinte do Leitor de Códigos com Validação Estrita e Tratamento de Erros
    domElements.barcode.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Força a conversão para String e remove espaços
            const code = String(domElements.barcode.value).trim();
            
            // Validação simples: apenas bloqueia inputs vazios
            if (!code) {
                statusLabel.innerText = "Código inválido.";
                statusLabel.style.color = "#e74c3c";
                return;
            }

            statusLabel.innerText = "A procurar...";
            statusLabel.style.color = "#f39c12";
            
            try {
                // Sincronia exata com o objeto global e método definidos em api_produtos.js
                const data = await APIProducts.fetchProduct(code);
                
                if (data.success || data.sucesso) { 
                    // Limpa previamente os dados recebidos da API ou nuvem antes de jogar nos inputs
                    domElements.baseDescription.value = sanitizeString(data.description || data.nome || "");
                    domElements.brand.value = sanitizeString(data.brand || data.marca || "");
                    
                    updateFinalDescription(); 

                    if (data.origin === "local" || data.origem === "local") {
                        statusLabel.innerText = "Produto Local Encontrado";
                        statusLabel.style.color = "#27ae60";
                        const splitPrice = parseFloat(data.price || data.preco).toFixed(2).split('.');
                        updateSalePriceUI(splitPrice[0], splitPrice[1]);
                        
                        domElements.profitMargin.value = "";
                        domElements.costReals.value = "";
                        domElements.costCents.value = "";
                        localStorage.removeItem('market_default_margin');
                        domElements.saleReals.focus();
                    } else {
                        statusLabel.innerText = "Não registado localmente.";
                        statusLabel.style.color = "#e74c3c";
                        domElements.baseDescription.focus();
                    }
                } else {
                    statusLabel.innerText = "Erro ou não encontrado.";
                    statusLabel.style.color = "#e74c3c";
                    domElements.baseDescription.focus();
                }
            } catch (error) {
                console.error("Falha na chamada de API:", error);
                statusLabel.innerText = "Falha de comunicação.";
                statusLabel.style.color = "#e74c3c";
                domElements.barcode.focus(); // Devolve o foco ao input em caso de pane
            }
        }
    });

    // 6. Blindagem de Submissão e Sanitização Final
    formRegistration.addEventListener('submit', (e) => {
        // Aplica a sanitização limpa e fallback da marca nos inputs antes do disparo
        domElements.baseDescription.value = sanitizeString(domElements.baseDescription.value);
        domElements.brand.value = sanitizeString(domElements.brand.value) || "SEM MARCA";
        
        updateFinalDescription();
        
        if (domElements.profitMargin.value) {
            localStorage.setItem('market_default_margin', domElements.profitMargin.value);
        }
        updateHiddenPriceUI();
        
        if (!domElements.finalPrice.value || parseFloat(domElements.finalPrice.value) === 0) {
            e.preventDefault();
            domElements.saleReals.focus();
        }
    });
});