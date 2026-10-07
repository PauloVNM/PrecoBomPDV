// Responsabilidade: Controlar o DOM (Ecrã), manipular estado persistente e escutar eventos do operador.
document.addEventListener('DOMContentLoaded', () => {
    const inputBarcode = document.getElementById('barcode');
    const tableBody = document.querySelector('#tabela-itens tbody');
    const displayTotal = document.getElementById('valor-total');
    const btnPaySale = document.querySelector('.btn-acao.pago');
    const btnCancelSale = document.querySelector('.btn-acao.cancelar');
    
    // 1. INICIALIZAÇÃO DA SESSÃO
    Cart.load();
    renderTable();

    // 2. ATUALIZAÇÃO DO ECRÃ
    function renderTable() {
        tableBody.innerHTML = '';
        
        Cart.items.forEach(item => {
            const row = `
                <tr>
                    <td>${item.barcode}</td>
                    <td>${item.brand}</td>
                    <td>${item.description}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="btn-menos" data-barcode="${item.barcode}" tabindex="-1">-</button>
                            <span style="min-width: 20px; text-align: center; font-weight: bold;">${item.quantity}</span>
                            <button class="btn-mais" data-barcode="${item.barcode}" tabindex="-1">+</button>
                        </div>
                    </td>
                    <td>R$ ${item.price.toFixed(2)}</td>
                    <td>R$ ${item.total.toFixed(2)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
        
        displayTotal.innerText = `R$ ${Cart.getTotal().toFixed(2)}`;
    }

    function cancelarVendaAtiva() {
        if (Cart.items.length === 0 && inputBarcode.value.trim() === '') return;
        
        Cart.clear();
        renderTable();
        inputBarcode.value = '';
        inputBarcode.focus();
    }

    // 3. OUVINTES DE EVENTOS
    btnCancelSale.addEventListener('click', cancelarVendaAtiva);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete') {
            const active = document.activeElement;
            // Impede o cancelamento se o operador estiver ativamente digitando no input (corrigindo um erro, por exemplo)
            if (active.tagName === 'INPUT' && active.value.trim() !== '') {
                return;
            }
            e.preventDefault();
            cancelarVendaAtiva();
        }
    });

    inputBarcode.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = inputBarcode.value.trim();
            if (!barcode) return;

            // Delega para a API
            const data = await APISales.fetchProductByBarcode(barcode);

            if (data.success && data.origin === 'local') {
                Cart.add(data, barcode);
                renderTable();
            } else {
                alert("Produto não registado ou não encontrado localmente.");
            }
            
            inputBarcode.value = '';
            inputBarcode.focus();
        }
    });

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-menos')) {
            Cart.decrease(e.target.getAttribute('data-barcode'));
            renderTable();
            inputBarcode.focus();
        }
        else if (e.target.classList.contains('btn-mais')) {
            Cart.increase(e.target.getAttribute('data-barcode'));
            renderTable();
            inputBarcode.focus();
        }
    });

    btnPaySale.addEventListener('click', async () => {
        if (Cart.items.length === 0) {
            alert("Caixa vazio. Bipe algum produto.");
            inputBarcode.focus();
            return;
        }

        if (!confirm('Confirma o fechamento da venda no valor de R$ ' + Cart.getTotal().toFixed(2) + '?')) return;

        const payload = {
            items: Cart.items,
            total_amount: Cart.getTotal()
        };

        btnPaySale.disabled = true;
        btnPaySale.innerText = "A GUARDAR...";

        // Delega para a API
        const data = await APISales.registerSale(payload);

        if (data.success || data.sucesso) {
            Cart.clear();
            renderTable();
            inputBarcode.value = '';
            btnPaySale.disabled = false;
            btnPaySale.innerText = "FINALIZAR VENDA";
            inputBarcode.focus();
        } else {
            alert("Erro no servidor: " + (data.message || data.mensagem || "Desconhecido"));
            btnPaySale.disabled = false;
            btnPaySale.innerText = "FINALIZAR VENDA";
            inputBarcode.focus();
        }
    });
});