import type { Hex } from '@metamask/utils';

export type NoxAddress = `0x${string}`;
export type NoxHandle = Hex;

export type NoxEncryptedInput = {
  handle: NoxHandle;
  handleProof: Hex;
};

export type NoxAccessControlList = {
  isPublic: boolean;
  admins: NoxAddress[];
  viewers: NoxAddress[];
};

/**
 * The narrow portion of the Nox Handle SDK used by the extension.
 *
 * Keeping this boundary small makes the privacy-sensitive code testable and
 * prevents SDK response objects from leaking into persisted wallet state.
 */
export type NoxHandleClient = {
  encryptInput: (
    value: bigint,
    solidityType: 'uint256',
    applicationContract: NoxAddress,
  ) => Promise<NoxEncryptedInput>;
  decrypt: (handle: NoxHandle) => Promise<{
    value: bigint | boolean | string;
    solidityType: string;
  }>;
  viewACL: (handle: NoxHandle) => Promise<NoxAccessControlList>;
};

export type ConfidentialActivityStatus =
  | 'preparing'
  | 'awaiting-signature'
  | 'blockchain-pending'
  | 'computation-queued'
  | 'computation-complete'
  | 'balance-synchronized'
  | 'failed';

export type ConfidentialActivity = {
  id: string;
  chainId: Hex;
  tokenAddress: NoxAddress;
  status: ConfidentialActivityStatus;
  transactionHash?: Hex;
  createdAt: number;
  updatedAt: number;
};
