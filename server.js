const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORRECTED BRAZILIAN NUMBER FORMATTING FUNCTION =====
function formatBrazilianNumber(value) {
    if (!value && value !== 0) return '0';
    
    let number = parseFloat(value);
    if (isNaN(number)) return '0';
    
    // ONLY format for display
    return number.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Supported currencies configuration
const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', code: 'USD' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', code: 'BRL' },
  EUR: { name: 'Euro', symbol: '€', code: 'EUR' },
  GBP: { name: 'British Pound', symbol: '£', code: 'GBP' },
  PYG: { name: 'Paraguayan Guarani', symbol: '₲', code: 'PYG' }
};

// Exchange rate cache (5 minutes)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware
app.use(compression());
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // maximum 10 requests per minute
  message: 'Too many requests. Try again in 1 minute.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/converter', limiter);

// Function to save conversion log
async function saveLog(conversion) {
  try {
    const logPath = path.join(__dirname, 'logs', 'conversions.json');
    let logs = [];
    
    try {
      const data = await fs.readFile(logPath, 'utf8');
      logs = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, create new
    }
    
    logs.push({
      timestamp: new Date().toISOString(),
      ...conversion
    });
    
    // Keep only the last 100 conversions
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

// Function to get exchange rate
async function getExchangeRate(from, to) {
  const cacheKey = `${from}-${to}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }
  
  try {
    // Using free alternative API
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      timeout: 5000
    });
    
    const rate = response.data.rates[to];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${to}`);
    }
    
    cache.set(cacheKey, { rate, timestamp: Date.now() });
    
    return rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error.message);
    throw new Error('Error getting exchange rate. Try again.');
  }
}

// Function to generate page HTML
function generateHTML(data = {}) {
  const { originCurrency = 'USD', destinationCurrency = 'BRL', value = '', result = null, error = null } = data;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Currency Converter</title>
    <link rel="stylesheet" href="/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="container">
        <!-- Central currency icon -->
        <div class="currency-icon">
            <span class="currency-symbol">${CURRENCIES[originCurrency]?.symbol || '$'}</span>
        </div>
        
        <!-- Conversion display -->
        <div class="conversion-display">
            <div class="currency-row">
                <!-- Change input types to text (not number) -->
                <div class="currency-input-group">
                    <span class="currency-label" id="labelOrigem" onclick="changeOriginCurrency()">${originCurrency}</span>
                    <input type="text" id="valorOrigem" class="currency-input" 
                           value="1" placeholder="0">
                </div>

                <span class="equals-text">=</span>

                <div class="currency-input-group">
                    <span class="currency-label" id="labelDestino" onclick="changeDestinationCurrency()">${destinationCurrency}</span>
                    <input type="text" id="valorDestino" class="currency-input" 
                           value="0,00" readonly>
                </div>
            </div>
        </div>
        
        <div class="divider"></div>
        ${error ? `<div class="error">${error}</div>` : ''}
        
        <!-- Credits at the end -->
        <div class="credits">
            <span>dev by</span> <strong>deandev</strong>
        </div>
    </div>
    <!-- INVISIBLE popup menu for currency exchange -->
    <div id="menuMoedas" class="currency-menu" style="display: none;">
        <div class="currency-option" data-currency="USD">USD - US Dollar</div>
        <div class="currency-option" data-currency="BRL">BRL - Brazilian Real</div>
        <div class="currency-option" data-currency="EUR">EUR - Euro</div>
        <div class="currency-option" data-currency="GBP">GBP - British Pound</div>
        <div class="currency-option" data-currency="PYG">PYG - Paraguayan Guarani</div>
    </div>

    <!-- Theme toggle button -->
    <div class="theme-toggle" id="themeToggle">&#9728;</div>

    <!-- External script -->
    <script src="/script.js"></script>
</body>
</html>`;
}

// GET route - Main page
app.get('/', (req, res) => {
  res.send(generateHTML());
});

// POST route - Process conversion
app.post('/converter', async (req, res) => {
  try {
    const { originCurrency, destinationCurrency, value } = req.body;
    
    // Validations
    if (!originCurrency || !destinationCurrency || !value) {
      return res.send(generateHTML({
        originCurrency,
        destinationCurrency,
        value,
        error: 'All fields are required.'
      }));
    }
    
    if (!CURRENCIES[originCurrency] || !CURRENCIES[destinationCurrency]) {
      return res.send(generateHTML({
        originCurrency,
        destinationCurrency,
        value,
        error: 'Unsupported currency.'
      }));
    }
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return res.send(generateHTML({
        originCurrency,
        destinationCurrency,
        value,
        error: 'Value must be a positive number.'
      }));
    }
    
    if (originCurrency === destinationCurrency) {
      return res.send(generateHTML({
        originCurrency,
        destinationCurrency,
        value,
        result: numericValue,
        error: 'Same currencies selected.'
      }));
    }
    
    // Get exchange rate
    const rate = await getExchangeRate(originCurrency, destinationCurrency);
    const result = numericValue * rate;
    
    // Save log
    await saveLog({
      from: originCurrency,
      to: destinationCurrency,
      amount: numericValue,
      result: result,
      rate: rate,
      ip: req.ip
    });
    
    // Return result
    res.send(generateHTML({
      originCurrency,
      destinationCurrency,
      value,
      result
    }));
    
  } catch (error) {
    console.error('Error in conversion:', error);
    res.send(generateHTML({
      originCurrency: req.body.originCurrency,
      destinationCurrency: req.body.destinationCurrency,
      value: req.body.value,
      error: error.message || 'Internal server error.'
    }));
  }
});

// New API route for automatic conversion
app.get('/api/convert', async (req, res) => {
  console.log('API convert called:', req.query); // DEBUG
  
  try {
    const { from, to, amount } = req.query;
    
    console.log('Received parameters:', { from, to, amount }); // DEBUG
    
    // Validations
    if (!from || !to || !amount) {
      console.log('Error: Missing parameters'); // DEBUG
      return res.status(400).json({ error: 'Required parameters' });
    }
    
    if (!CURRENCIES[from] || !CURRENCIES[to]) {
      console.log('Error: Unsupported currency'); // DEBUG
      return res.status(400).json({ error: 'Unsupported currency' });
    }
    
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue) || numericValue <= 0) {
      console.log('Error: Invalid value'); // DEBUG
      return res.status(400).json({ error: 'Invalid value' });
    }
    
    if (from === to) {
      console.log('Same currencies, returning original value'); // DEBUG
      return res.json({ result: numericValue, rate: 1 });
    }
    
    // Get rate and calculate
    console.log('Getting exchange rate...'); // DEBUG
    const rate = await getExchangeRate(from, to);
    const result = numericValue * rate;
    
    console.log('Rate obtained:', rate, 'Result:', result); // DEBUG
    
    // Save log
    await saveLog({
      from, to, amount: numericValue, result: result, rate: rate, ip: req.ip
    });
    
    res.json({ result: result, rate: rate });
    
  } catch (error) {
    console.error('Error in API convert:', error); // DEBUG
    res.status(500).json({ error: error.message });
  }
});

// Route to get logs (optional, for debug)
app.get('/logs', async (req, res) => {
  try {
    const logPath = path.join(__dirname, 'logs', 'conversions.json');
    const data = await fs.readFile(logPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.json([]);
  }
});

// ADD to server for testing
app.get('/test-rate/:from/:to', async (req, res) => {
  const { from, to } = req.params;
  
  try {
    const rate = await getExchangeRate(from, to);
    
    res.json({
      from,
      to,
      rate: rate,
      examples: {
        '1': 1 * rate,
        '100': 100 * rate,
        '1000': 1000 * rate,
        '100000': 100000 * rate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Currency Converter running at http://localhost:${PORT}`);
  console.log(`📊 Logs saved at: logs/conversions.json`);
  console.log(`💱 Supported currencies: ${Object.keys(CURRENCIES).join(', ')}`);
}); 