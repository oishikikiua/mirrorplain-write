/**
 * EIP-6963: Multi Injected Provider Discovery
 */

import { Eip1193Provider } from "ethers";

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface Eip6963AnnounceProviderEvent extends Event {
  type: "eip6963:announceProvider";
  detail: Eip6963ProviderDetail;
}

export interface Eip6963RequestProviderEvent extends Event {
  type: "eip6963:requestProvider";
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": Eip6963AnnounceProviderEvent;
    "eip6963:requestProvider": Eip6963RequestProviderEvent;
  }
}

