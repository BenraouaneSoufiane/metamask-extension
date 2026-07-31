import {
  NoxService,
  NoxValidationError,
  assertActivityTransition,
} from './nox-service';
import type { NoxAddress, NoxHandleClient } from './types';

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111';
const HANDLE = `0x${'22'.repeat(32)}` as const;

describe('NoxService', () => {
  it('encrypts a positive transfer amount for the confidential token', async () => {
    const client = createClient();
    const service = new NoxService(client);

    await expect(
      service.encryptTransferAmount(40n, TOKEN_ADDRESS),
    ).resolves.toStrictEqual({ handle: HANDLE, handleProof: '0x1234' });
    expect(client.encryptInput).toHaveBeenCalledWith(
      40n,
      'uint256',
      TOKEN_ADDRESS,
    );
  });

  it.each([0n, -1n])('rejects invalid transfer amount %s', async (amount) => {
    const service = new NoxService(createClient());

    await expect(
      service.encryptTransferAmount(amount, TOKEN_ADDRESS),
    ).rejects.toThrow('Transfer amount must be greater than zero.');
  });

  it('rejects malformed SDK handles', async () => {
    const client = createClient();
    jest.mocked(client.encryptInput).mockResolvedValue({
      handle: '0x12',
      handleProof: '0x1234',
    });
    const service = new NoxService(client);

    await expect(
      service.encryptTransferAmount(40n, TOKEN_ADDRESS),
    ).rejects.toThrow('Expected a 32-byte Nox handle.');
  });

  it('returns a decrypted uint256 balance without caching it', async () => {
    const client = createClient();
    const service = new NoxService(client);

    await expect(service.decryptBalance(HANDLE)).resolves.toBe(160n);
    expect(client.decrypt).toHaveBeenCalledWith(HANDLE);
  });

  it('rejects a decrypted value with an unexpected type', async () => {
    const client = createClient();
    jest.mocked(client.decrypt).mockResolvedValue({
      value: true,
      solidityType: 'bool',
    });
    const service = new NoxService(client);

    await expect(service.decryptBalance(HANDLE)).rejects.toThrow(
      'Confidential balance did not decrypt to a uint256 value.',
    );
  });

  it('validates ACL addresses', async () => {
    const client = createClient();
    jest.mocked(client.viewACL).mockResolvedValue({
      isPublic: false,
      admins: [],
      viewers: ['invalid' as NoxAddress],
    });
    const service = new NoxService(client);

    await expect(service.getAccessControlList(HANDLE)).rejects.toThrow(
      'Expected a 20-byte EVM address.',
    );
  });
});

describe('assertActivityTransition', () => {
  it('accepts the asynchronous Nox lifecycle', () => {
    expect(() =>
      assertActivityTransition('blockchain-pending', 'computation-queued'),
    ).not.toThrow();
    expect(() =>
      assertActivityTransition('computation-complete', 'balance-synchronized'),
    ).not.toThrow();
  });

  it('rejects skipped and terminal transitions', () => {
    expect(() =>
      assertActivityTransition('blockchain-pending', 'balance-synchronized'),
    ).toThrow(NoxValidationError);
    expect(() =>
      assertActivityTransition('balance-synchronized', 'failed'),
    ).toThrow(NoxValidationError);
  });
});

function createClient(): jest.Mocked<NoxHandleClient> {
  return {
    encryptInput: jest.fn().mockResolvedValue({
      handle: HANDLE,
      handleProof: '0x1234',
    }),
    decrypt: jest.fn().mockResolvedValue({
      value: 160n,
      solidityType: 'uint256',
    }),
    viewACL: jest.fn().mockResolvedValue({
      isPublic: false,
      admins: [TOKEN_ADDRESS],
      viewers: [],
    }),
  };
}
