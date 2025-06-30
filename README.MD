## SOLANA IDO PLATFORM

### Step 1: Create pool

- Start time, end time, claim time
- Total amount 
- Price
- Currency (SPL token)
- How much user can buy -> signer

### Step 2: buy token
- User buy token by spending usdt


### Note
- We can create TokenAccount by using ATA (Associated Token Account) -> this is standard approach
  - only specific user to hold units of a specific token (mint)

- Use PDA (Program Derived Address)
  - allows for deterministic token account addresses specific to your program
