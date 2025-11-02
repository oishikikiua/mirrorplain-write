/**
 * FHEVM Types
 */

import { Eip1193Provider } from "ethers";

export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInputBuilder;
  encrypt32(value: number): Uint8Array;
  getPublicKey(): string;
  getPublicParams(size: number): string;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint | boolean>>;
}

export interface EncryptedInputBuilder {
  add32(value: number): EncryptedInputBuilder;
  encrypt(): Promise<{ handles: string[]; inputProof: string }>;
}

export interface FhevmInstanceConfig {
  aclContractAddress: string;
  kmsContractAddress: string;
  coprocessorAddress: string;
  publicKey: string;
  publicParams: string;
  network: Eip1193Provider | string;
}

export interface EIP712Type {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: string;
  types: {
    EIP712Domain: Array<{ name: string; type: string }>;
    UserDecryptRequestVerification: Array<{ name: string; type: string }>;
  };
  message: {
    publicKey: string;
    contractAddresses: string[];
    startTimestamp: number;
    durationDays: number;
  };
}

export interface FhevmDecryptionSignatureType {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
}

