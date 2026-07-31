import type { Hex } from '@metamask/utils';
import type {
  ConfidentialActivityStatus,
  NoxAccessControlList,
  NoxAddress,
  NoxEncryptedInput,
  NoxHandle,
  NoxHandleClient,
} from './types';

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/u;
const HANDLE_PATTERN = /^0x[0-9a-fA-F]{64}$/u;

const ACTIVITY_TRANSITIONS: Record<
  ConfidentialActivityStatus,
  readonly ConfidentialActivityStatus[]
> = {
  preparing: ['awaiting-signature', 'failed'],
  'awaiting-signature': ['blockchain-pending', 'failed'],
  'blockchain-pending': ['computation-queued', 'failed'],
  'computation-queued': ['computation-complete', 'failed'],
  'computation-complete': ['balance-synchronized', 'failed'],
  'balance-synchronized': [],
  failed: [],
};

export class NoxValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoxValidationError';
  }
}

export function assertNoxAddress(value: string): asserts value is NoxAddress {
  if (!ADDRESS_PATTERN.test(value)) {
    throw new NoxValidationError('Expected a 20-byte EVM address.');
  }
}

export function assertNoxHandle(value: string): asserts value is NoxHandle {
  if (!HANDLE_PATTERN.test(value)) {
    throw new NoxValidationError('Expected a 32-byte Nox handle.');
  }
}

export function assertActivityTransition(
  current: ConfidentialActivityStatus,
  next: ConfidentialActivityStatus,
): void {
  if (!ACTIVITY_TRANSITIONS[current].includes(next)) {
    throw new NoxValidationError(
      `Invalid confidential activity transition: ${current} -> ${next}.`,
    );
  }
}

/**
 * Privacy-sensitive Nox operations.
 *
 * This service intentionally has no telemetry or persistence dependency.
 * Callers must not persist the plaintext arguments or decrypted return value.
 */
export class NoxService {
  readonly #client: NoxHandleClient;

  constructor(client: NoxHandleClient) {
    this.#client = client;
  }

  async encryptTransferAmount(
    amount: bigint,
    confidentialTokenAddress: string,
  ): Promise<NoxEncryptedInput> {
    if (amount <= 0n) {
      throw new NoxValidationError(
        'Transfer amount must be greater than zero.',
      );
    }
    assertNoxAddress(confidentialTokenAddress);

    const encryptedInput = await this.#client.encryptInput(
      amount,
      'uint256',
      confidentialTokenAddress,
    );
    assertNoxHandle(encryptedInput.handle);
    assertHex(encryptedInput.handleProof, 'handle proof');
    return encryptedInput;
  }

  async decryptBalance(balanceHandle: string): Promise<bigint> {
    assertNoxHandle(balanceHandle);
    const result = await this.#client.decrypt(balanceHandle);

    if (result.solidityType !== 'uint256' || typeof result.value !== 'bigint') {
      throw new NoxValidationError(
        'Confidential balance did not decrypt to a uint256 value.',
      );
    }
    return result.value;
  }

  async getAccessControlList(handle: string): Promise<NoxAccessControlList> {
    assertNoxHandle(handle);
    const acl = await this.#client.viewACL(handle);
    [...acl.admins, ...acl.viewers].forEach(assertNoxAddress);
    return acl;
  }
}

function assertHex(value: string, label: string): asserts value is Hex {
  if (!/^0x(?:[0-9a-fA-F]{2})*$/u.test(value)) {
    throw new NoxValidationError(`Expected ${label} to be hex encoded.`);
  }
}
