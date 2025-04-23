# Solana Programs: 
Favorites & Escrow This folder contains two Solana on-chain programs built using Anchor: 
1. **Favorites**: A program initialized with a Jest-based test template.
2.  **Escrow**: A multiple-template program for escrow operations. 

## Installation Requirements 
To work with these programs, ensure the following tools are installed:  **1. Rust (Stable)** 
Install Rust using the official Rustup installer: 
```bash
 curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
**2. Solana CLI (v2.1.17)**
Download and install the Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.17/install)"
```
**3. Anchor (v0.31.1)**

Install Anchor CLI and `avm` (Anchor Version Manager):
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.1 --force anchor-cli avm avm install 0.31.1 avm list
```
**Note**: Anchor uses the `rustc` binary provided by the Solana CLI. Ensure you use the correct version by verifying:
```bash
cargo build-sbf --version
```
## Setting Up the Programs

### Favorites Program

1.  Initialize the program:
    ```bash
    anchor init --test-template jest favorites
    ```
      
2. Run tests:
	``` bash
	   anchor test
	``` 

### Escrow Program

1.  Initialize the program with a multiple-template setup:
    ```bash
    anchor init --test-template jest --template=multiple escrow
    ```
2.  Run tests:
    ```bash
    anchor test
    ```