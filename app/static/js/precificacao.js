// Responsabilidade: Cálculos financeiros e formatação. Sem interação com o HTML.

const Precificacao = {
    formatarCentavos: function(valorStr) {
        if (!valorStr) return '00';
        if (valorStr.length === 1) return valorStr + '0';
        return valorStr.slice(0, 2);
    },

    calcularVenda: function(margem, reais, centsStr) {
        const custoTotal = parseFloat(`${reais || 0}.${this.formatarCentavos(centsStr)}`);
        
        if (custoTotal > 0 && margem >= 0) {
            const precoVendaTotal = custoTotal * (1 + (margem / 100));
            const vendaStr = precoVendaTotal.toFixed(2).split('.');
            return {
                reais: vendaStr[0],
                centavos: vendaStr[1]
            };
        }
        return null;
    },

    obterPrecoFinalOculto: function(reais, centsStr) {
        const vReais = parseInt(reais) || 0;
        const vCents = this.formatarCentavos(centsStr);
        return `${vReais}.${vCents}`;
    }
};