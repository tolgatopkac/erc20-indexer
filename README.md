# 🪙 Advanced ERC-20 Token Indexer

A modern, feature-rich ERC-20 token indexer built with React, Vite, and Chakra UI. This application allows users to explore ERC-20 token balances for any Ethereum address with comprehensive wallet integration, ENS support, and a beautiful user interface.

## 🌟 Features

### ✨ Core Features
- **🔗 Wallet Integration**: Connect MetaMask to automatically check your token balances
- **🌐 ENS Support**: Enter ENS names (e.g., `vitalik.eth`) instead of long addresses
- **⚡ Real-time Validation**: Instant feedback on address format and ENS resolution
- **📊 Token Portfolio Display**: Beautiful card-based layout showing token metadata
- **🎨 Modern UI**: Glass-morphism design with gradient backgrounds and smooth animations

### 🛡️ Security & Reliability
- **🔐 Comprehensive Error Handling**: Robust error management for all edge cases
- **✅ Input Validation**: Real-time validation for Ethereum addresses and ENS names
- **🚨 Error Boundaries**: Graceful error handling with user-friendly messages
- **⚠️ Type Safety**: Extensive type checking to prevent runtime errors

### 🎯 User Experience
- **⏳ Loading States**: Beautiful loading indicators with step-by-step progress
- **🔄 State Management**: Seamless state transitions and updates
- **📱 Responsive Design**: Works perfectly on all device sizes
- **🎭 Visual Feedback**: Real-time icons and colors for different states

## 🚀 Live Demo

**🌐 [View Live Application](https://tolgatopkac.github.io/erc20-indexer/)**

## ��️ Technology Stack

### Core Technologies
- **React 18.2.0** - Modern React with hooks and concurrent features
- **Vite 5.0.0** - Lightning-fast build tool and development server
- **Chakra UI 2.8.2** - Modular and accessible component library
- **Ethers.js 6.15.0** - Ethereum JavaScript library for blockchain interactions
- **Alchemy SDK 3.6.1** - Powerful blockchain development platform

### Additional Libraries
- **@emotion/react** & **@emotion/styled** - CSS-in-JS for Chakra UI
- **Framer Motion** - Animation library for smooth transitions
- **gh-pages** - Automated GitHub Pages deployment

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- MetaMask browser extension
- Alchemy API key

### 1. Clone Repository
```bash
git clone https://github.com/tolgatopkac/erc20-indexer.git
cd erc20-indexer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

**Get your Alchemy API key:**
1. Visit [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new project
3. Copy your API key
4. Add it to your `.env` file

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
npm run deploy       # Deploy to GitHub Pages
npm run predeploy    # Pre-deployment build (runs automatically)
```

## 📖 Usage Guide

### 🔗 Wallet Connection
1. Click "Connect Wallet" to connect your MetaMask
2. Your address will be automatically filled
3. Click "Check Token Balances" to see your tokens

### 📝 Manual Address Entry
1. Enter any Ethereum address (0x...)
2. Or enter an ENS name (e.g., `vitalik.eth`)
3. Real-time validation will guide you
4. Click "Check Token Balances" to fetch data

### 🎨 Visual Indicators
- **✅ Green**: Valid address format
- **🌐 Purple**: ENS name detected
- **⚠️ Red**: Validation error
- **🔄 Yellow**: ENS resolution in progress
- **🔗 Blue**: Wallet connected

## 🏗️ Project Structure

```
erc20-indexer/
├── public/
│   └── favicon.png
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── dist/                # Production build output
├── .env                 # Environment variables
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## 🌐 Deployment

This project is configured for automatic deployment to GitHub Pages.

### Deploy to GitHub Pages
```bash
npm run deploy
```

### Manual Deployment Steps
1. Build the project: `npm run build`
2. The `dist` folder contains the production build
3. Deploy the `dist` folder to your hosting provider

## 🔒 Security Features

### Input Validation
- **Address Format**: Validates Ethereum address format (0x + 40 hex characters)
- **ENS Resolution**: Validates ENS names and resolves to addresses
- **Zero Address Check**: Prevents usage of zero address
- **Type Safety**: Extensive runtime type checking

### Error Handling
- **Network Errors**: Graceful handling of connection issues
- **API Errors**: Proper error messages for API failures
- **Rate Limiting**: Handles API rate limits gracefully
- **Validation Errors**: Clear feedback for invalid inputs

## 🎯 Features Implementation

### ✅ Completed Challenges
1. **✅ Wallet Integration**: MetaMask connection with automatic address detection
2. **✅ Loading States**: Comprehensive loading indicators with progress steps
3. **✅ Modern Styling**: Glass-morphism design with gradients and animations
4. **✅ Balance Formatting**: Properly formatted token balances with decimal handling
5. **✅ Error Handling**: Robust error management with user-friendly messages
6. **✅ Responsive Design**: Beautiful grid layout that works on all devices
7. **✅ Performance**: Optimized API calls with Promise.allSettled for reliability
8. **✅ ENS Support**: Full ENS name resolution with validation

### 🔮 Future Enhancements
- **Token Price Integration**: Show USD values for tokens
- **Portfolio Analytics**: Calculate total portfolio value
- **Transaction History**: Display recent transactions
- **Multi-chain Support**: Add support for other EVM chains
- **Token Filtering**: Filter tokens by value or type
- **Export Functionality**: Export portfolio data to CSV/JSON

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow the existing code style
2. Add appropriate error handling
3. Test your changes thoroughly
4. Update documentation as needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Credits

- **Original Template**: Based on Alchemy's ERC-20 Indexer skeleton
- **Enhanced By**: Tolga Topkac
- **Powered By**: Alchemy SDK, Ethers.js, React, Chakra UI

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/tolgatopkac/erc20-indexer/issues) page
2. Make sure your `.env` file is properly configured
3. Verify that MetaMask is installed and connected
4. Check that you have a valid Alchemy API key

---

**🚀 Ready to explore the world of ERC-20 tokens? [Launch the App](https://tolgatopkac.github.io/erc20-indexer/) and start discovering!**
