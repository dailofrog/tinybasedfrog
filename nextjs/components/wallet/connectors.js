import { InjectedConnector } from '@web3-react/injected-connector'

export const injected = new InjectedConnector({
  supportedChainIds: [1, 8453, 84532],
  //supportedChainIds: [1], // mainnet
})