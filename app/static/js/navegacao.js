// Responsabilidade: Motor global de navegação matricial (Keyboard-only).
// Intercepta eventos de teclado para mover o foco entre seções e itens, garantindo operação 100% sem mouse.
const MotorNavegacao = {
    // 1. ESTADO DA MÁQUINA
    indiceSecaoAtual: 0,
    indiceItemAtual: 0,
    secoesNavegaveis: [],
    
    // 2. PONTO DE IGNIÇÃO
    iniciar: function() {
        this.secoesNavegaveis = this.mapearSecoes();
        
        // Cláusula de Guarda: Se a tela é cega (sem alvos), o motor desliga sozinho.
        if (this.secoesNavegaveis.length === 0) return;
        
        this.definirFocoInicial();
        this.escutarTeclado();
    },
    
    // 3. FERRAMENTAS DE MAPEAMENTO E CALIBRAÇÃO
    mapearSecoes: function() {
        return Array.from(document.querySelectorAll('section')).filter(secao => {
            return secao.querySelectorAll('a, input, button').length > 0;
        });
    },
    
    definirFocoInicial: function() {
        const elementoComAutofocus = document.querySelector('[autofocus]');
        
        // Sem alvo prioritário? Atira no primeiro item que achar e encerra.
        if (!elementoComAutofocus) {
            const primeirosItens = this.obterItensDaSecao(0);
            if (primeirosItens.length > 0) primeirosItens[0].focus();
            return;
        }
        
        // Tem alvo prioritário: recalibra as coordenadas da matriz.
        const secaoPai = elementoComAutofocus.closest('section');
        if (secaoPai) {
            this.indiceSecaoAtual = this.secoesNavegaveis.indexOf(secaoPai);
            const itensDaSecao = this.obterItensDaSecao(this.indiceSecaoAtual);
            this.indiceItemAtual = itensDaSecao.indexOf(elementoComAutofocus);
            
            elementoComAutofocus.focus();
        }
    },
    
    obterItensDaSecao: function(indiceDaSecao) {
        return Array.from(this.secoesNavegaveis[indiceDaSecao].querySelectorAll('a, input, button'));
    },
    
    // 4. MOVIMENTO
    escutarTeclado: function() {
        document.addEventListener('keydown', (evento) => {
            const elementoAtivo = document.activeElement;
            
            if (evento.key === 'Escape') {
                this.executarBotaoPanico(evento);
                return;
            }
            if (evento.key === 'ArrowRight') {
                this.navegarHorizontal(evento, 1);
                return;
            }
            if (evento.key === 'ArrowLeft') {
                this.navegarHorizontal(evento, -1);
                return;
            }
            if (evento.key === 'ArrowDown') {
                this.navegarVertical(evento, 1);
                return;
            }
            if (evento.key === 'ArrowUp') {
                this.navegarVertical(evento, -1);
                return;
            }
            if (evento.key === 'Enter') {
                this.lidarComTeclaEnter(evento, elementoAtivo);
            }
        });
    },

    // 5. MOTORES DE MOVIMENTO
    navegarHorizontal: function(evento, direcao) {
        evento.preventDefault(); // Mata o scroll padrão da página
        
        const itensDaSecaoAtual = this.obterItensDaSecao(this.indiceSecaoAtual);
        
        // Matemática modular para criar um loop infinito dentro da mesma linha (se passar do fim, volta pro começo)
        this.indiceItemAtual = (this.indiceItemAtual + direcao + itensDaSecaoAtual.length) % itensDaSecaoAtual.length;
        itensDaSecaoAtual[this.indiceItemAtual].focus();
    },
    
    navegarVertical: function(evento, direcao) {
        evento.preventDefault();
        
        // Pula de seção (bloco vertical)
        this.indiceSecaoAtual = (this.indiceSecaoAtual + direcao + this.secoesNavegaveis.length) % this.secoesNavegaveis.length;
        
        const itensDaNovaSecao = this.obterItensDaSecao(this.indiceSecaoAtual);
        this.indiceItemAtual = 0; // Sempre reseta pro primeiro item da nova seção
        
        if (itensDaNovaSecao.length > 0) {
            itensDaNovaSecao[this.indiceItemAtual].focus();
        }
    },
    
    lidarComTeclaEnter: function(evento, elementoAtivo) {
        const ehInputDeTexto = elementoAtivo.tagName === 'INPUT' && 
                               (elementoAtivo.type === 'text' || elementoAtivo.type === 'number');
        const ehLeitorDeCodigo = elementoAtivo.id === 'codigo_ean' || elementoAtivo.id === 'barcode';
        
        // Enter em input normal atua como um "Tab" (pula pro próximo)
        if (ehInputDeTexto && !ehLeitorDeCodigo) {
            this.navegarHorizontal(evento, 1);
        }
        // Se for leitor de EAN ou um botão, não fazemos preventDefault(), deixamos o HTML/JS das outras telas resolver.
    },
    
    executarBotaoPanico: function(evento) {
        evento.preventDefault();
        
        // Cláusula de guarda: bloqueia o "voltar" na raiz do sistema
        if (window.location.pathname === '/') {
            return;
        }
        
        window.history.back();
    }
};

// 6. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    MotorNavegacao.iniciar();
});