import { Interface } from '@ethersproject/abi';
import {
  encodeConfidentialBalanceOf,
  encodeConfidentialTransfer,
  encodeFinalizeUnwrap,
  encodeUnderlying,
  encodeUnwrapRequest,
  encodeWrap,
} from './confidential-token';

const ACCOUNT = '0x1111111111111111111111111111111111111111';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const HANDLE = `0x${'33'.repeat(32)}` as const;
const ENCRYPTED_INPUT = { handle: HANDLE, handleProof: '0x1234' } as const;

describe('confidential token calldata', () => {
  it('encodes confidentialBalanceOf', () => {
    const data = encodeConfidentialBalanceOf(ACCOUNT);
    const decoded = new Interface([
      'function confidentialBalanceOf(address account) view returns (bytes32)',
    ]).decodeFunctionData('confidentialBalanceOf', data);

    expect(decoded.account).toBe(ACCOUNT);
  });

  it('encodes a transfer without including the plaintext amount', () => {
    const data = encodeConfidentialTransfer(RECIPIENT, ENCRYPTED_INPUT);
    const decoded = new Interface([
      'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof)',
    ]).decodeFunctionData('confidentialTransfer', data);

    expect(decoded.to).toBe(RECIPIENT);
    expect(decoded.encryptedAmount).toBe(HANDLE);
    expect(decoded.inputProof).toBe('0x1234');
  });

  it('encodes wrapper reads and public wrapping', () => {
    expect(encodeUnderlying()).toMatch(/^0x[0-9a-f]{8}$/u);
    expect(encodeWrap(ACCOUNT, 200_000_000n)).toMatch(/^0x/u);
  });

  it('encodes unwrap request and finalization', () => {
    expect(encodeUnwrapRequest(ACCOUNT, RECIPIENT, ENCRYPTED_INPUT)).toMatch(
      /^0x/u,
    );
    expect(encodeFinalizeUnwrap(HANDLE, '0x1234')).toMatch(/^0x/u);
  });

  it('rejects zero wrapping and malformed proofs', () => {
    expect(() => encodeWrap(ACCOUNT, 0n)).toThrow(
      'Wrap amount must be greater than zero.',
    );
    expect(() =>
      encodeConfidentialTransfer(RECIPIENT, {
        handle: HANDLE,
        handleProof: '0x',
      }),
    ).toThrow('Expected a non-empty hex-encoded Nox proof.');
  });
});
