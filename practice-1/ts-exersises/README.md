# Solana TypeScript Utilities
 
This repository contains TypeScript files for various Solana-related operations, including:

- Generating key pairs
- Checking balances
- Creating and minting tokens
- Adding metadata to tokens
- Sending SOL transactions

All files are designed specifically for interacting with Solana's blockchain.

## Getting Started

### Step 1: Initialize the Project

1. Initialize a new Node.js project
```bash
    npm init -y
 ```  
2. Create a `package.json` file in the project directory.
3. Install the required dependencies by running:
```bash
npm i esrun @solana/web3.js @solana-developers/helpers
```
4. To add support for token metadata management, later install:
```bash 
npm i @metaplex-foundation/mpl-token-metadata
```

### Step 2: Run TypeScript Files

To execute any TypeScript file, use the following command:
```bash
npx esrun <file_name.ts>
```
Replace `<file_name.ts>` with the name of the TypeScript file you want to run.
