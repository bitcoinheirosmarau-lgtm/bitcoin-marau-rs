/**
 * Bitcoin Marau RS - Live Data Integration
 */

async function updateDashboard() {
    const priceEl = document.getElementById('btc-price');
    const changeEl = document.getElementById('btc-change');
    const fgValEl = document.getElementById('fg-value');
    const fgBar = document.getElementById('fg-bar');
    const signalEl = document.getElementById('signal-text');

    if (!priceEl && !fgValEl) return; // Exit if no dashboard elements found

    try {
        // 1. Fetch Bitcoin Price - CoinGecko with Fallback to Binance
        let btcBrl, btcChange;

        try {
            const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true');
            if (!priceResponse.ok) throw new Error('CoinGecko Fail');
            const priceData = await priceResponse.json();
            btcBrl = priceData.bitcoin.brl;
            btcChange = priceData.bitcoin.brl_24h_change;
        } catch (e) {
            console.warn('CGecko falhou, tentando Binance...');
            const binanceResp = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCBRL');
            const binanceData = await binanceResp.json();
            btcBrl = parseFloat(binanceData.lastPrice);
            btcChange = parseFloat(binanceData.priceChangePercent);
        }

        if (priceEl) {
            priceEl.innerText = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(btcBrl || 0);
        }

        if (changeEl) {
            changeEl.innerHTML = `<span class="w-2 h-2 rounded-full ${btcChange >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse"></span> ${btcChange > 0 ? '+' : ''}${btcChange.toFixed(2)}% (24h)`;
            changeEl.className = btcChange >= 0 ? 'text-sm font-bold text-emerald-400 flex items-center gap-2' : 'text-sm font-bold text-rose-400 flex items-center gap-2';
        }

        // 2. Fetch Fear & Greed Index
        const fgResponse = await fetch('https://api.alternative.me/fng/');
        const fgData = await fgResponse.json();
        const fgValue = parseInt(fgData.data[0].value);
        const fgClassification = fgData.data[0].value_classification;

        if (fgValEl) fgValEl.innerText = `${fgValue} - ${fgClassification}`;
        if (fgBar) fgBar.style.width = `${fgValue}%`;

        // 3. Update signaling
        if (signalEl) {
            if (fgValue > 70) {
                signalEl.innerText = 'VENDA';
                signalEl.className = 'text-4xl font-black mb-2 text-rose-500 font-display';
            } else if (fgValue < 30) {
                signalEl.innerText = 'COMPRA';
                signalEl.className = 'text-4xl font-black mb-2 text-emerald-500 font-display';
            } else {
                signalEl.innerText = 'NEUTRO';
                signalEl.className = 'text-4xl font-black mb-2 text-[#1E6B5A] font-display';
            }
        }

    } catch (error) {
        console.error('Erro geral no dashboard:', error);
        if (priceEl) priceEl.innerText = 'Indisponível';
    }
}

// Global UI interactions
function initUI() {
    // Handle hash scrolling if coming from another page
    if (window.location.hash) {
        setTimeout(() => {
            const el = document.querySelector(window.location.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
}

// Mobile Menu Toggle
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const links = document.querySelectorAll('.mobile-menu a');

    if (!toggle || !menu || !overlay) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    overlay.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    initUI();
    initMobileMenu();
    setInterval(updateDashboard, 60000); // 1 minute refresh
});
