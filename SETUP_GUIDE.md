# Crypto Zombies Setup Guide

This guide will help you set up and run the Crypto Zombies project on a fresh machine.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (version 16 or higher)

   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Ganache** (GUI version recommended)

   - Download from: https://trufflesuite.com/ganache/
   - Or install via npm: `npm install -g ganache-cli`

3. **MetaMask** browser extension
   - Install from: https://metamask.io/

## Setup Instructions

### Step 1: Clone and Install Dependencies

```bash
# Navigate to the project directory
cd crypto-zombies-blockchain-midterm

# Install backend dependencies
npm install

# Install frontend dependencies
cd cryptozombies-frontend
npm install
cd ..
```

### Step 2: Start Ganache

1. **Using Ganache GUI:**

   - Open Ganache application
   - Click "New Workspace"
   - Add the project folder
   - Click "Start"

2. **Using Ganache CLI:**
   ```bash
   ganache-cli --port 7545 --networkId 1337
   ```

### Step 3: Configure MetaMask

1. Open MetaMask extension
2. Click on network dropdown (usually shows "Ethereum Mainnet")
3. Select "Add Network" → "Add a network manually"
4. Enter the following details:
   - **Network Name:** Ganache
   - **RPC URL:** http://127.0.0.1:7545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH
5. Click "Save"

### Step 4: Import Ganache Account

1. In Ganache, copy the first account's private key
2. In MetaMask, click account icon → "Import Account"
3. Paste the private key and click "Import"

### Step 5: Deploy Contracts

```bash
# Deploy contracts to Ganache
truffle migrate --reset

# This will automatically update contract addresses in the frontend
```

### Step 6: Start the Frontend

```bash
# From the project root directory
cd cryptozombies-frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Troubleshooting

### Common Issues

1. **"Contract not deployed" error:**

   - Make sure Ganache is running
   - Run `truffle migrate --reset` again

2. **MetaMask connection issues:**

   - Ensure you're on the Ganache network
   - Check that the account has ETH (should be automatic with Ganache)

3. **Frontend won't start:**

   - Make sure you're in the `cryptozombies-frontend` directory
   - Run `npm install` if you haven't already

4. **Contract addresses mismatch:**
   - The migration script automatically updates addresses
   - If issues persist, manually update using:
     ```bash
     node updateContractAddresses.js zombieOwnership <new_address>
     ```

### Network Configuration

The project is configured for:

- **Ganache Network:** Chain ID 1337, Port 7545
- **RPC URL:** http://127.0.0.1:7545

### File Structure

```
crypto-zombies-blockchain-midterm/
├── contracts/                 # Solidity contracts
├── migrations/               # Deployment scripts
├── cryptozombies-frontend/   # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   └── config/          # Contract addresses config
│   └── package.json
├── build/                    # Compiled contracts
└── package.json             # Backend dependencies
```

## Features

- ✅ Dynamic contract address management
- ✅ Automatic address updates on deployment
- ✅ MetaMask integration
- ✅ Zombie creation and management
- ✅ Level up system
- ✅ DNA modification

## Development Commands

```bash
# Deploy contracts
truffle migrate --reset

# Run tests
truffle test

# Start frontend development server
cd cryptozombies-frontend && npm run dev

# Build frontend for production
cd cryptozombies-frontend && npm run build
```

## Support

If you encounter any issues:

1. Check that all prerequisites are installed
2. Ensure Ganache is running on port 7545
3. Verify MetaMask is connected to the Ganache network
4. Check the browser console for error messages
