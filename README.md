# MirrorPlain Write

A privacy-preserving writing statistics dApp built with FHEVM (Fully Homomorphic Encryption Virtual Machine). Track your writing duration and word count while keeping your content completely private.

## Features

- 🔒 **Encrypted Writing Statistics**: Track word count and writing duration using fully homomorphic encryption
- 📊 **Analytics Dashboard**: View weekly heatmaps, monthly trends, and goal progress
- 🎯 **Goal Setting**: Set and track weekly/monthly writing goals
- 🏆 **Milestones**: Achieve milestones like "First Entry", "1K Words", "7-Day Streak"
- 👥 **Mentor Authorization**: Grant read-only access to mentors/editors
- 🌐 **Web3 Integration**: Connect with MetaMask and interact with FHEVM contracts

## Tech Stack

- **Smart Contracts**: Solidity with FHEVM v0.9
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Deployment**: Vercel

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat setup
│   ├── contracts/              # Solidity contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── tasks/                  # Hardhat custom tasks
├── mirrorplain-write-frontend/  # Next.js frontend application
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── fhevm/                  # FHEVM integration
│   └── abi/                    # Contract ABIs and addresses
└── frontend/                   # Reference frontend (read-only)
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- MetaMask browser extension
- Hardhat node (for local development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MirrorPlainWrite
   ```

2. **Install contract dependencies**

   ```bash
   cd fhevm-hardhat-template
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../mirrorplain-write-frontend
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cd ../fhevm-hardhat-template
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

### Development

#### Local Development (Mock Mode)

1. **Start Hardhat node**

   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

2. **Deploy contracts locally**

   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend in mock mode**

   ```bash
   cd ../mirrorplain-write-frontend
   npm run dev:mock
   ```

#### Testnet Development

1. **Deploy to Sepolia**

   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network sepolia
   ```

2. **Generate ABI and addresses**

   ```bash
   cd ../mirrorplain-write-frontend
   npm run genabi
   ```

3. **Start frontend**

   ```bash
   npm run dev
   ```

### Building

```bash
cd mirrorplain-write-frontend
npm run build
```

The static export will be generated in the `out/` directory.

## Contract Details

### MirrorPlainWrite Contract

**Network**: Sepolia Testnet  
**Address**: `0x75c54450F64a48ba7102F3b7aA18B29419043178`

### Key Functions

- `submitEntry(uint32 words, uint32 duration)`: Submit encrypted writing statistics
- `setGoals(uint32 weeklyGoal, uint32 monthlyGoal)`: Set writing goals
- `checkMilestone(uint32 threshold)`: Check if a milestone is achieved
- `allowMentor(address mentor)`: Grant read-only access to a mentor
- `revokeAccess(address mentor)`: Revoke mentor access

## Frontend Deployment

The frontend is deployed on Vercel:

**Production URL**: https://mirrorplain-write-vaak3ia9c7j7ki8zp.vercel.app

## Testing

### Contract Tests

```bash
cd fhevm-hardhat-template
npm test
```

### Frontend Static Export Check

```bash
cd mirrorplain-write-frontend
npm run check:static
```

## FHEVM Integration

This project uses FHEVM v0.9 with the following key features:

- **Encrypted Types**: `euint32` for encrypted integers
- **Operations**: `FHE.add`, `FHE.gt` for encrypted arithmetic and comparison
- **Permissions**: `FHE.allow` for granting decryption access
- **Client Encryption**: `FHE.fromExternal` for converting client-encrypted data

## Security

- All writing statistics are encrypted on-chain using FHEVM
- Decryption requires explicit user authorization via EIP-712 signatures
- No sensitive data is stored in plaintext
- Mentor access is granted on a per-address basis

## License

BSD-3-Clause-Clear

## Support

For issues and questions, please open an issue on GitHub.

