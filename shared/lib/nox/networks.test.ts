import { getNoxNetworkConfig, NOX_NETWORKS } from './networks';

describe('Nox network configuration', () => {
  it('configures the networks supported by the Handle SDK', () => {
    expect(Object.keys(NOX_NETWORKS)).toStrictEqual(['0x66eee', '0xaa36a7']);
    expect(getNoxNetworkConfig('0x66eee')).toMatchObject({
      chainIdDecimal: 421_614,
      name: 'Arbitrum Sepolia',
      gatewayUrl: 'https://gateway-testnets.noxprotocol.dev',
      noxComputeAddress: '0xd464B198f06756a1d00be223634b85E0a731c229',
    });
  });

  it('does not invent a cUSDC deployment address', () => {
    expect(
      getNoxNetworkConfig('0x66eee').confidentialUsdcAddress,
    ).toBeUndefined();
  });

  it('rejects an unsupported chain', () => {
    expect(() => getNoxNetworkConfig('0x1')).toThrow(
      'Nox is not configured for chain 0x1.',
    );
  });
});
