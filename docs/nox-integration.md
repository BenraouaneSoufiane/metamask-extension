# MetaMask Noxed integration

This branch contains the privacy-sensitive domain boundary for integrating
MetaMask with the iExec Nox Handle SDK. It targets confidential-value
transfers: amounts and balances can be encrypted, while wallet addresses,
contract addresses, transaction timing, and gas payer remain public.

## Supported test networks

The configuration in `shared/lib/nox/networks.ts` mirrors the defaults in
`@iexec-nox/handle` 0.1.0-beta.13:

| Network          |              Chain ID | NoxCompute                                   |
| ---------------- | --------------------: | -------------------------------------------- |
| Arbitrum Sepolia |    421614 (`0x66eee`) | `0xd464B198f06756a1d00be223634b85E0a731c229` |
| Ethereum Sepolia | 11155111 (`0xaa36a7`) | `0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf` |

Both currently use `https://gateway-testnets.noxprotocol.dev`; each has its
own subgraph URL in the configuration module.

The published `@iexec-nox/nox-confidential-contracts` package contains the
`ERC20ToERC7984Wrapper` implementation, but it does not publish a deployed
cUSDC address. A cUSDC address must therefore be supplied only after a wrapper
deployment is verified on the chosen testnet. The wallet should verify that
the wrapper's `underlying()` value is the intended USDC contract before
enabling wrap or unwrap.

## Security invariants

- Plaintext transfer amounts and decrypted balances must not be written to
  controller state, logs, telemetry, Redux, or remote error reports.
- Only 32-byte handles and proofs may cross into transaction construction.
- The initial ERC-20 wrap amount and final unwrap amount are public.
- A confirmed blockchain transaction is not proof that the asynchronous Nox
  computation has completed.
- Decryption must be initiated by the user and authorized using the SDK's
  EIP-712 flow.

## Integration sequence

1. Instantiate `@iexec-nox/handle` with MetaMask's signer adapter and the
   supported network configuration.
2. Inject the resulting client into `NoxService`.
3. Add an ERC-7984 token controller for contract reads and transaction
   construction. Persist handles and activity statuses only.
4. Add background actions for encrypt, decrypt, ACL read, wrap, confidential
   transfer, unwrap request, and unwrap finalization.
5. Add an opt-in asset UI and confirmation screens with the privacy disclosure.
6. Gate the feature by chain and remote feature flag until the Nox deployment
   addresses and service endpoints are production-approved.

`@iexec-nox/nox-confidential-contracts` is intended for a separate contracts
workspace used to deploy and test wrappers. It should not be bundled into the
browser extension merely to obtain ABIs; checked, minimal ABIs keep the wallet
bundle and LavaMoat surface smaller.
