import type { Hex } from '@metamask/utils';
import type { NoxAddress } from './types';

export type NoxNetworkConfig = {
  chainId: Hex;
  chainIdDecimal: number;
  name: string;
  gatewayUrl: string;
  noxComputeAddress: NoxAddress;
  subgraphUrl: string;
  confidentialUsdcAddress?: NoxAddress;
};

/**
 * Networks built into @iexec-nox/handle 0.1.0-beta.13.
 *
 * Confidential token addresses are deliberately not guessed. Add cUSDC only
 * after verifying a deployed wrapper's bytecode and `underlying()` response.
 */
export const NOX_NETWORKS: Readonly<Record<Hex, NoxNetworkConfig>> = {
  '0x66eee': {
    chainId: '0x66eee',
    chainIdDecimal: 421_614,
    name: 'Arbitrum Sepolia',
    gatewayUrl: 'https://gateway-testnets.noxprotocol.dev',
    noxComputeAddress: '0xd464B198f06756a1d00be223634b85E0a731c229',
    subgraphUrl:
      'https://thegraph.arbitrum-sepolia-testnet.noxprotocol.io/api/subgraphs/id/BjQAX2HpmsSAzURJimKDhjZZnkSJtaczA8RPumggrStb',
  },
  '0xaa36a7': {
    chainId: '0xaa36a7',
    chainIdDecimal: 11_155_111,
    name: 'Ethereum Sepolia',
    gatewayUrl: 'https://gateway-testnets.noxprotocol.dev',
    noxComputeAddress: '0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf',
    subgraphUrl:
      'https://thegraph.ethereum-sepolia-testnet.noxprotocol.io/api/subgraphs/id/9CsccKwvgYFo72zZeU4k4wj2NEBLdWhVE3EUandgmzgo',
  },
};

export function getNoxNetworkConfig(chainId: Hex): NoxNetworkConfig {
  const config = NOX_NETWORKS[chainId];
  if (!config) {
    throw new Error(`Nox is not configured for chain ${chainId}.`);
  }
  return config;
}
