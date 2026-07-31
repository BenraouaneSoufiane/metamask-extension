import { Interface } from '@ethersproject/abi';
import type { Hex } from '@metamask/utils';
import {
  assertNoxAddress,
  assertNoxHandle,
  NoxValidationError,
} from './nox-service';
import type { NoxEncryptedInput } from './types';

const CONFIDENTIAL_TOKEN_INTERFACE = new Interface([
  'function confidentialBalanceOf(address account) view returns (bytes32)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
]);

const WRAPPER_INTERFACE = new Interface([
  'function underlying() view returns (address)',
  'function wrap(address to, uint256 amount) returns (bytes32)',
  'function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
  'function finalizeUnwrap(bytes32 unwrapRequestId, bytes decryptedAmountAndProof)',
]);

export function encodeConfidentialBalanceOf(account: string): Hex {
  assertNoxAddress(account);
  return CONFIDENTIAL_TOKEN_INTERFACE.encodeFunctionData(
    'confidentialBalanceOf',
    [account],
  ) as Hex;
}

export function encodeConfidentialTransfer(
  recipient: string,
  encryptedInput: NoxEncryptedInput,
): Hex {
  assertNoxAddress(recipient);
  validateEncryptedInput(encryptedInput);
  return CONFIDENTIAL_TOKEN_INTERFACE.encodeFunctionData(
    'confidentialTransfer(address,bytes32,bytes)',
    [recipient, encryptedInput.handle, encryptedInput.handleProof],
  ) as Hex;
}

export function encodeUnderlying(): Hex {
  return WRAPPER_INTERFACE.encodeFunctionData('underlying') as Hex;
}

export function encodeWrap(recipient: string, publicAmount: bigint): Hex {
  assertNoxAddress(recipient);
  assertPositiveAmount(publicAmount);
  return WRAPPER_INTERFACE.encodeFunctionData('wrap', [
    recipient,
    publicAmount,
  ]) as Hex;
}

export function encodeUnwrapRequest(
  owner: string,
  recipient: string,
  encryptedInput: NoxEncryptedInput,
): Hex {
  assertNoxAddress(owner);
  assertNoxAddress(recipient);
  validateEncryptedInput(encryptedInput);
  return WRAPPER_INTERFACE.encodeFunctionData(
    'unwrap(address,address,bytes32,bytes)',
    [owner, recipient, encryptedInput.handle, encryptedInput.handleProof],
  ) as Hex;
}

export function encodeFinalizeUnwrap(
  unwrapRequestId: string,
  decryptedAmountAndProof: Hex,
): Hex {
  assertNoxHandle(unwrapRequestId);
  assertProof(decryptedAmountAndProof);
  return WRAPPER_INTERFACE.encodeFunctionData('finalizeUnwrap', [
    unwrapRequestId,
    decryptedAmountAndProof,
  ]) as Hex;
}

function validateEncryptedInput(encryptedInput: NoxEncryptedInput): void {
  assertNoxHandle(encryptedInput.handle);
  assertProof(encryptedInput.handleProof);
}

function assertProof(proof: string): void {
  if (!/^0x(?:[0-9a-fA-F]{2})+$/u.test(proof)) {
    throw new NoxValidationError('Expected a non-empty hex-encoded Nox proof.');
  }
}

function assertPositiveAmount(amount: bigint): void {
  if (amount <= 0n) {
    throw new NoxValidationError('Wrap amount must be greater than zero.');
  }
}
