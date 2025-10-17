# CryptoZombies - Midterm Project 
## CPSC - 559 (Advanced Blockchain Technologies)

### Team Maember: 

#### 1. Anuj More       - <Email>   -  <GitHub>     
#### 2. Druv Nakum      - <Email>   -  <GitHub>  
#### 3. Ishan Jawade    - ishanjawade@csu.fullerton.edu  -  <a href="https://github.com/IshanJawade" target="_blank">IshanJawade</a>

# CryptoZombies — Local Development README

A lightweight CryptoZombies project combining Solidity contracts (Truffle) and a React + Vite frontend. The repository includes deployment scripts that automatically update the frontend contract address configuration.

This README summarizes what the repo contains, how to run it locally with Ganache + MetaMask, and where to find important files and helpers.

---

## Quick overview — What this project does

- Solidity contracts implementing CryptoZombies gameplay, ERC-721 ownership and a minimal Kitty-compatible contract:
  - Contracts: [`contracts/zombiefactory.sol`](contracts/zombiefactory.sol), [`contracts/zombiefeeding.sol`](contracts/zombiefeeding.sol), [`contracts/zombiehelper.sol`](contracts/zombiehelper.sol), [`contracts/zombieattack.sol`](contracts/zombieattack.sol), [`contracts/zombieownership.sol`](contracts/zombieownership.sol), [`contracts/KittyCore.sol`](contracts/KittyCore.sol)
  - Common libraries / interfaces: [`contracts/safemath.sol`](contracts/safemath.sol), [`contracts/erc721.sol`](contracts/erc721.sol), [`contracts/ownable.sol`](contracts/ownable.sol), [`contracts/Migrations.sol`](contracts/Migrations.sol)

- Truffle migrations deploy contracts and write deployed addresses into frontend config:
  - Migration: [`migrations/2_deploy_contracts.js`](migrations/2_deploy_contracts.js)
  - The migration updates frontend address config at: [`cryptozombies-frontend/src/config/contractAddresses.js`](cryptozombies-frontend/src/config/contractAddresses.js)

- Frontend (Vite + React) reads contract addresses and ABI:
  - Frontend entry: [`cryptozombies-frontend/src/main.jsx`](cryptozombies-frontend/src/main.jsx)
  - Main component: [`cryptozombies-frontend/src/components/CryptoZombies.jsx`](cryptozombies-frontend/src/components/CryptoZombies.jsx)
  - Contract addresses: [`cryptozombies-frontend/src/config/contractAddresses.js`](cryptozombies-frontend/src/config/contractAddresses.js) — exposes [`getContractAddress`](cryptozombies-frontend/src/config/contractAddresses.js)
  - ABI: [`cryptozombies-frontend/src/cryptozombies_abi.json`](cryptozombies-frontend/src/cryptozombies_abi.json) and script binding [`cryptozombies-frontend/src/cryptozombies_abi.js`](cryptozombies-frontend/src/cryptozombies_abi.js)

---

## Prerequisites

- Node.js (v16+ recommended) — see [`package.json`](package.json)
- npm
- Ganache (GUI or CLI) running on port 7545 (Chain ID 1337)
- MetaMask (browser extension) for frontend transactions

Full setup steps are available in the included guide: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)

---

## Quick start (local Ganache)

1. Install backend dependencies (project root)
```bash
npm install
```

2. Start Ganache
- GUI: open Ganache app and start a workspace
- CLI:
```bash
ganache-cli --port 7545 --networkId 1337
```

3. Compile & deploy contracts (Truffle)
```bash
truffle migrate --reset
```
- The migration script [`migrations/2_deploy_contracts.js`](migrations/2_deploy_contracts.js) writes addresses into:
  - [`contractAddresses.txt`](contractAddresses.txt)
  - [`cryptozombies-frontend/src/config/contractAddresses.js`](cryptozombies-frontend/src/config/contractAddresses.js)
- The migration populates the address map used by the frontend.

4. Start the frontend
```bash
cd cryptozombies-frontend
npm install
npm run dev
```
- Open the app at the Vite dev URL (usually `http://localhost:5173`)

---

## Frontend notes

- The frontend uses Web3 to connect to the user's wallet; it calls [`getContractAddress`](cryptozombies-frontend/src/config/contractAddresses.js) to obtain deployed addresses at runtime.
- ABI used by the frontend: [`cryptozombies-frontend/src/cryptozombies_abi.json`](cryptozombies-frontend/src/cryptozombies_abi.json)
- Main React component: [`cryptozombies-frontend/src/components/CryptoZombies.jsx`](cryptozombies-frontend/src/components/CryptoZombies.jsx)
  - UI styling: [`cryptozombies-frontend/src/components/CryptoZombie.css`](cryptozombies-frontend/src/components/CryptoZombie.css)
- Vite config: [`cryptozombies-frontend/vite.config.js`](cryptozombies-frontend/vite.config.js)
- Frontend package settings: [`cryptozombies-frontend/package.json`](cryptozombies-frontend/package.json)

---

## Recommended development workflow

1. Start Ganache (GUI or CLI).
2. Deploy contracts:
   - `truffle migrate --reset` — updates [`contractAddresses.txt`](contractAddresses.txt) and [`cryptozombies-frontend/src/config/contractAddresses.js`](cryptozombies-frontend/src/config/contractAddresses.js).
3. Run the frontend dev server:
   - `cd cryptozombies-frontend && npm run dev`
4. Open the frontend in the browser and connect MetaMask to the Ganache network.
5. Use helper scripts:
   - Verify address consistency: `node testContractAddresses.js` (`testContractAddresses` in [`testContractAddresses.js`](testContractAddresses.js))
   - Manually update an address: `node updateContractAddresses.js <name> <0x...>` (`updateContractAddress` in [`updateContractAddresses.js`](updateContractAddresses.js))

---

## File map (important files & symbols)

- Project root:
  - [`package.json`](package.json)
  - [`truffle-config.js`](truffle-config.js)
  - [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
  - [`contractAddresses.txt`](contractAddresses.txt)
  - [`writeContractAddressToFile.js`](writeContractAddressToFile.js) — [`writeContractAddressesToFile`](writeContractAddressToFile.js)
  - [`updateContractAddresses.js`](updateContractAddresses.js) — [`updateContractAddress`](updateContractAddresses.js)
  - [`testContractAddresses.js`](testContractAddresses.js) — [`testContractAddresses`](testContractAddresses.js)
  - [`migrations/2_deploy_contracts.js`](migrations/2_deploy_contracts.js)
- Contracts:
  - [`contracts/zombiefactory.sol`](contracts/zombiefactory.sol)
  - [`contracts/zombiefeeding.sol`](contracts/zombiefeeding.sol)
  - [`contracts/zombiehelper.sol`](contracts/zombiehelper.sol)
  - [`contracts/zombieattack.sol`](contracts/zombieattack.sol)
  - [`contracts/zombieownership.sol`](contracts/zombieownership.sol)
  - [`contracts/KittyCore.sol`](contracts/KittyCore.sol)
  - Helpers: [`contracts/safemath.sol`](contracts/safemath.sol), [`contracts/ownable.sol`](contracts/ownable.sol), [`contracts/erc721.sol`](contracts/erc721.sol)
- Frontend (React + Vite):
  - [`cryptozombies-frontend/src/main.jsx`](cryptozombies-frontend/src/main.jsx)
  - [`cryptozombies-frontend/src/App.jsx`](cryptozombies-frontend/src/App.jsx)
  - [`cryptozombies-frontend/src/components/CryptoZombies.jsx`](cryptozombies-frontend/src/components/CryptoZombies.jsx)
  - [`cryptozombies-frontend/src/components/CryptoZombie.css`](cryptozombies-frontend/src/components/CryptoZombie.css)
  - [`cryptozombies-frontend/src/config/contractAddresses.js`](cryptozombies-frontend/src/config/contractAddresses.js) — [`getContractAddress`](cryptozombies-frontend/src/config/contractAddresses.js)
  - ABI: [`cryptozombies-frontend/src/cryptozombies_abi.json`](cryptozombies-frontend/src/cryptozombies_abi.json) and [`cryptozombies-frontend/src/cryptozombies_abi.js`](cryptozombies-frontend/src/cryptozombies_abi.js)

---

## Notes & recommendations

- Contracts target Solidity ^0.4.25 — ensure Truffle / solc config in [`truffle-config.js`](truffle-config.js) uses a compatible compiler.
- Keep private keys / mnemonics out of the repository.
- If you plan to deploy to a remote testnet (Infura / Alchemy), add an HD wallet provider and set a mnemonic via an ignored file — see commented examples in [`truffle-config.js`](truffle-config.js).
- Use the included test script [`testContractAddresses.js`](testContractAddresses.js) to validate that frontend and `contractAddresses.txt` are in sync.

---

## Licence
Licensed under the MIT License — see LICENSE or https://opensource.org/licenses/MIT for details.

© 2025 Team Members: Anuj More, Druv Nakum, Ishan Jawade. All rights reserved.