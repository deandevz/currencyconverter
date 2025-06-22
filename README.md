# 💱 Currency Converter

A modern and intuitive currency converter built with Node.js and vanilla JavaScript.

## Features

- **Real-time conversion** with live exchange rates
- **Beautiful UI** with smooth animations
- **Multiple currencies** supported (USD, BRL, EUR, GBP, PYG)
- **Smart formatting** with Brazilian number format
- **Bidirectional conversion** - click on destination to convert back
- **Automatic updates** with debounced input
- **Mobile responsive** design

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd currency-converter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Technology Stack

- **Backend:** Node.js + Express.js
- **Frontend:** Vanilla JavaScript + HTML5 + CSS3
- **API:** Exchange Rate API (free tier)
- **Styling:** Custom CSS with modern design
- **Fonts:** Inter (Google Fonts)

## 📸 Screenshot

<img src="https://i.imgur.com/oIdYAf0.jpeg" alt="Interface Screenshot" width="700"/>
<img src="https://i.imgur.com/b2nXDvQ.png" alt="Interface Screenshot" width="700"/>

## 📁 Project Structure

```
currency-converter/
├── public/
│   ├── script.js          # Main JavaScript file
│   └── style.css          # Styles
├── logs/
│   └── conversions.json   # Conversion logs
├── server.js              # Express server
├── package.json           # Dependencies
├── README.md              # This file
└── correction-test.html   # Test page
```

## API Endpoints

### Main Routes
- `GET /` - Main application page
- `POST /converter` - Process conversion (legacy)
- `GET /api/convert` - API for automatic conversion

### Debug Routes
- `GET /logs` - View conversion logs
- `GET /test-rate/:from/:to` - Test exchange rates

### Example API Usage
```javascript
// Convert 100 USD to BRL
fetch('/api/convert?from=USD&to=BRL&amount=100')
  .then(response => response.json())
  .then(data => console.log(data));
// Response: { result: 549, rate: 5.49 }
```

## 💡 How It Works

### 1. **Smart Number Formatting**
- Detects Brazilian format (1.000,50) vs American format (1000.50)
- Automatically formats numbers during typing
- Preserves cursor position

### 2. **Real-time Conversion**
- Debounced input (300ms delay)
- Automatic API calls
- Live exchange rate updates

### 3. **Bidirectional Conversion**
- Click on destination field to enable reverse conversion
- Automatic formatting in both directions

## UI Features

### Currency Selection
- Click on currency labels to change
- Popup menu with all supported currencies
- Automatic icon updates

### Input Formatting
- Real-time thousand separators
- Decimal place limiting (2 digits)
- Brazilian number format (1.000,00)

### Visual Feedback
- Loading states during conversion
- Error handling with user-friendly messages
- Smooth animations and transitions

## Debug & Testing

### Test Page
Access `http://localhost:3000/correction-test.html` for:
- Function testing
- API testing
- Debug logs
- Predefined test cases

### Console Logs
Open browser DevTools (F12) to see:
- Input processing
- API calls
- Conversion steps
- Error details

## Supported Currencies

| Currency | Code | Symbol | Name |
|----------|------|--------|------|
| USD | $ | US Dollar |
| BRL | R$ | Brazilian Real |
| EUR | € | Euro |
| GBP | £ | British Pound |
| PYG | ₲ | Paraguayan Guarani |

## Known Issues & Solutions

### Issue: Formatting Resets Value
**Solution:** Implemented smart formatting that only updates when necessary.

### Issue: Wrong Conversion Results
**Solution:** Fixed number extraction function to handle all formats correctly.

### Issue: Cursor Position Lost
**Solution:** Added cursor positioning logic to maintain user experience.

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
```

### API Configuration
The app uses the free Exchange Rate API. For production, consider:
- API key for higher rate limits
- Caching strategies
- Fallback APIs

## Performance

- **Caching:** 5-minute exchange rate cache
- **Rate Limiting:** 10 requests per minute per IP
- **Compression:** Gzip enabled
- **Debouncing:** 300ms input delay

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source, enjoy it!

## 👨‍💻 Developer

**deandev** - Full-stack developer.

---


