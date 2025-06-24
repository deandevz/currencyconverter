// ===== SIMPLE AND CORRECT FORMATTING FUNCTIONS =====

// Simple function to format number for display
function formatNumberSimple(value) {
    if (!value && value !== 0) return '';
    
    let number = parseFloat(value);
    if (isNaN(number)) return '';
    
    // ONLY format for display, WITHOUT changing the value
    return number.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// CORRECTED function to extract number
function extractNumber(valueString) {
    if (!valueString) return 0;
    
    console.log('Extracting from:', valueString); // DEBUG
    
    // Remove spaces and convert to string
    let clean = valueString.toString().trim();
    
    // If it has comma, it's Brazilian format (1.000,50)
    if (clean.includes(',')) {
        // Remove dots (thousand separators) and replace comma with dot
        clean = clean.replace(/\./g, '').replace(',', '.');
    }
    // If no comma, it can be American format or just number
    else {
        // If it has only one dot and numbers after, it's American decimal (1000.50)
        // If it has multiple dots, they are Brazilian separators (1.000.000)
        let dots = clean.split('.');
        if (dots.length > 2) {
            // Multiple dots = Brazilian separators (1.000.000)
            clean = clean.replace(/\./g, '');
        }
        // If it has only one dot with 1-2 digits after, it's decimal
        else if (dots.length === 2 && dots[1].length <= 2) {
            // Keep as is (1000.50)
        }
        // Otherwise, remove dots (they are separators)
        else if (dots.length === 2 && dots[1].length > 2) {
            clean = clean.replace(/\./g, '');
        }
    }
    
    let result = parseFloat(clean) || 0;
    console.log('Extracted result:', result); // DEBUG
    return result;
}

// SIMPLIFIED VERSION that does NOT reset
function formatDuringTyping(input) {
    let value = input.value;
    let cursorPosition = input.selectionStart;
    
    console.log('Formatting:', value, 'Cursor at:', cursorPosition); // DEBUG
    
    // Remove everything that is not number or comma
    let cleanNumber = value.replace(/[^\d,]/g, '');
    
    // If empty, do nothing
    if (!cleanNumber) {
        return;
    }
    
    // Split integer and decimal parts
    let parts = cleanNumber.split(',');
    let integerPart = parts[0];
    let decimalPart = parts[1];
    
    // CHECK if integer part is not empty
    if (!integerPart) {
        return;
    }
    
    // Format integer part with separators
    let formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Build final value
    let finalValue = formattedIntegerPart;
    if (decimalPart !== undefined) {
        // Limit decimals to 2 digits
        decimalPart = decimalPart.substring(0, 2);
        finalValue += ',' + decimalPart;
    }
    
    // ONLY update if it really changed
    if (finalValue !== value) {
        input.value = finalValue;
        
        // Place cursor at the end
        setTimeout(() => {
            let newPos = finalValue.length;
            input.setSelectionRange(newPos, newPos);
        }, 0);
    }
    
    console.log('Final value:', finalValue); // DEBUG
}

// Currency exchange system WITHOUT ugly selects
let currentCurrency = 'origin'; // 'origin' or 'destination'
let converter = null;

// Portuguese function names for HTML compatibility
function trocarMoedaOrigem() {
    changeOriginCurrency();
}

function trocarMoedaDestino() {
    changeDestinationCurrency();
}

function changeOriginCurrency() {
    console.log('Clicked on origin'); // DEBUG
    currentCurrency = 'origin';
    showCurrencyMenu();
}

function changeDestinationCurrency() {
    console.log('Clicked on destination'); // DEBUG
    currentCurrency = 'destination';
    showCurrencyMenu();
}

function showCurrencyMenu() {
    console.log('Showing menu'); // DEBUG
    
    // Remove previous overlay if exists
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) existingOverlay.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.onclick = closeCurrencyMenu;
    document.body.appendChild(overlay);
    
    // Show menu
    const menu = document.getElementById('menuMoedas');
    if (menu) {
        menu.style.display = 'block';
        
        // REMOVE previous event listeners
        document.querySelectorAll('.currency-option').forEach(option => {
            option.replaceWith(option.cloneNode(true));
        });
        
        // Add new event listeners
        document.querySelectorAll('.currency-option').forEach(option => {
            option.onclick = (e) => {
                e.stopPropagation();
                selectCurrency(option.dataset.currency);
            };
        });
    }
}

function closeCurrencyMenu() {
    const menu = document.getElementById('menuMoedas');
    const overlay = document.querySelector('.overlay');
    
    menu.style.display = 'none';
    if (overlay) overlay.remove();
}

function selectCurrency(currency) {
    console.log('Selecting currency:', currency, 'for:', currentCurrency); // DEBUG
    
    if (currentCurrency === 'origin') {
        document.getElementById('labelOrigem').textContent = currency;
        converter.updateCurrencyIcon();
    } else {
        document.getElementById('labelDestino').textContent = currency;
    }
    
    closeCurrencyMenu();
    converter.convert(); // Reconvert automatically
}

// AutomaticConverter class with Real-time Formatting
class AutomaticConverter {
    constructor() {
        this.debounceTimer = null;
        this.init();
    }
    
    init() {
        console.log('Initializing converter');
        this.setupEventListeners();
        this.updateCurrencyIcon();
        setTimeout(() => this.convert(), 500);
    }
    
    setupEventListeners() {
        const originValue = document.getElementById('valorOrigem');
        
        if (!originValue) {
            console.error('Input valorOrigem not found!');
            return;
        }
        
        // Event listener with real-time formatting
        originValue.addEventListener('input', (e) => {
            console.log('Input detected:', e.target.value);
            
            // Format during typing
            formatDuringTyping(e.target);
            
            // Convert with debounce
            this.convertWithDebounce();
        });
        
        // Avoid pasting unformatted text
        originValue.addEventListener('paste', (e) => {
            setTimeout(() => {
                formatDuringTyping(e.target);
                this.convert();
            }, 10);
        });
        
        // Bidirectional conversion with formatting
        this.setupBidirectionalConversion();
    }
    
    setupBidirectionalConversion() {
        const destinationValue = document.getElementById('valorDestino');
        if (!destinationValue) return;
        
        destinationValue.addEventListener('click', () => {
            if (destinationValue.readOnly) {
                destinationValue.readOnly = false;
                destinationValue.focus();
                
                const handleInput = (e) => {
                    formatDuringTyping(e.target);
                    this.reverseConvert();
                };
                
                const handleBlur = (e) => {
                    formatDuringTyping(e.target);
                    destinationValue.readOnly = true;
                    destinationValue.removeEventListener('input', handleInput);
                    destinationValue.removeEventListener('blur', handleBlur);
                };
                
                destinationValue.addEventListener('input', handleInput);
                destinationValue.addEventListener('blur', handleBlur);
            }
        });
    }
    
    convertWithDebounce() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.convert();
        }, 300);
    }
    
    async convert() {
        console.log('=== STARTING CONVERSION ===');
        
        const from = this.getOriginCurrency();
        const to = this.getDestinationCurrency();
        const inputValue = document.getElementById('valorOrigem').value;
        
        console.log('Value in input:', inputValue);
        
        // Extract clean number for API
        const amount = extractNumber(inputValue);
        
        console.log('=== CONVERSION DATA ===');
        console.log('From:', from);
        console.log('To:', to);
        console.log('Input value:', inputValue);
        console.log('Extracted amount:', amount);
        
        if (!amount || amount <= 0) {
            console.log('Invalid amount, stopping conversion');
            document.getElementById('valorDestino').value = '0,00';
            return;
        }
        
        try {
            this.showLoading();
            
            const url = `/api/convert?from=${from}&to=${to}&amount=${amount}`;
            console.log('API URL:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('=== API RESPONSE ===');
            console.log('Status:', response.status);
            console.log('Data:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log('Rate:', data.rate);
            console.log('Raw result:', data.result);
            
            // Format result
            const formattedValue = formatNumberSimple(data.result);
            document.getElementById('valorDestino').value = formattedValue;
            
            console.log('Final formatted value:', formattedValue);
            console.log('=== END CONVERSION ===');
            
        } catch (error) {
            console.error('ERROR in conversion:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async reverseConvert() {
        const from = this.getDestinationCurrency();
        const to = this.getOriginCurrency();
        const inputValue = document.getElementById('valorDestino').value;
        
        const amount = extractNumber(inputValue);
        
        if (!amount || amount <= 0) return;
        
        try {
            const response = await fetch(`/api/convert?from=${from}&to=${to}&amount=${amount}`);
            const data = await response.json();
            
            if (!data.error) {
                const formattedValue = formatNumberSimple(data.result);
                document.getElementById('valorOrigem').value = formattedValue;
            }
        } catch (error) {
            console.error('Error in reverse conversion:', error);
        }
    }
    
    getOriginCurrency() {
        const element = document.getElementById('labelOrigem');
        return element ? element.textContent : 'USD';
    }
    
    getDestinationCurrency() {
        const element = document.getElementById('labelDestino');
        return element ? element.textContent : 'BRL';
    }
    
    updateCurrencyIcon() {
        const originCurrency = this.getOriginCurrency();
        const symbols = {
            'USD': '$', 'BRL': 'R$', 'EUR': '€', 'GBP': '£', 'PYG': '₲'
        };
        
        const iconElement = document.querySelector('.currency-symbol');
        if (iconElement) {
            iconElement.textContent = symbols[originCurrency] || '$';
        }
    }
    
    showLoading() {
        const destination = document.getElementById('valorDestino');
        if (destination) {
            destination.style.opacity = '0.5';
            destination.value = '...';
        }
    }
    
    hideLoading() {
        const destination = document.getElementById('valorDestino');
        if (destination) {
            destination.style.opacity = '1';
        }
    }
    
    showError(message) {
        const destination = document.getElementById('valorDestino');
        if (destination) {
            destination.value = 'Error';
        }
    }
}

// INITIALIZATION
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConverter);
} else {
    initializeConverter();
}

function initializeConverter() {
    console.log('Initializing automatic converter');
    converter = new AutomaticConverter();
    
    // FORCED TEST after 1 second
    setTimeout(() => {
        if (converter) {
            console.log('Forcing initial conversion');
            converter.convert();
        }
    }, 1000);
}

// DEBUG
console.log('Script loaded');
console.log('Found elements:', {
    labelOrigem: document.getElementById('labelOrigem'),
    labelDestino: document.getElementById('labelDestino'),
    menuMoedas: document.getElementById('menuMoedas')
});

// CHECK if converter is being initialized
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    converter = new AutomaticConverter();
    console.log('Converter initialized');

    applyStoredTheme();
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.addEventListener('click', () => {
            toggleTheme();
        });
    }
});

function applyStoredTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light', theme === 'light');
    updateThemeIcon(theme);
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    const theme = isLight ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);

    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.classList.add('spin');
        setTimeout(() => btn.classList.remove('spin'), 500);
    }
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = theme === 'light' ? '\ud83c\udf19' : '\u2600\ufe0f';
    }
}
