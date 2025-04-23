# Zk-Access

ZK-Access is a platform that enables organizations to easily issue decentralized identities by leveraging zero-knowledge email verification technology. The system validates email ownership for automatic credential issuance and uses the Aztec chain to store secure hashes, ensuring that decentralized identifiers (DIDs) remain tamper-proof.


## Overview


ZK-Access provides a seamless way for organizations to issue verifiable credentials to their members based on email ownership proof. Using zero-knowledge proofs, users can verify they own an email address from a specific domain without revealing the content of their emails.


## Key Features


- **Email-Based Verification**: Uses zk-email technology to cryptographically verify email ownership

- **Decentralized Credentials**: Issues verifiable credentials that can be used across various systems
  
- **Tamper-Proof Storage**: Secures credential hashes on the Aztec blockchain

- **Privacy-Preserving**: Validates credentials without exposing sensitive information

## Architecture

ZK-Access consists of two main components:

- **Frontend**: A Next.js application providing a user-friendly interface for requesting credentials

- **Backend**: A NestJS API that handles email verification, proof generation, and credential issuance
  
## Technologies


- **Frontend**: Next.js, React, Tailwind CSS
  
- **Backend**: NestJS, Veramo, zk-email SDK

- **Storage**: Aztec blockchain for secure hash storage

- **Identity**: Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs)

## Getting Started

See the [frontend](./frontend/README.md) and [backend](./backend/README.md) directories for specific setup instructions.

## How It Works


1. Users initiate a credential request from the platform
   
2. They send a verification email from their organization email address
   
3. The system validates email ownership using zero-knowledge proofs
   
4. A verifiable credential is issued to the user
   
5. The credential hash is stored on the Aztec chain for future verification