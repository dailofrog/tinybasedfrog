import Image from "react-bootstrap/Image";

export const FORCE_MAINNET = true; // will popup metamask to connect to mainnet if on another chain
export const STAY_MYSTERIOUS = false;
export const FORCE_GOERLI_CONTRACTS = !FORCE_MAINNET; // SET TO FALSE ON LIVE

const CONTRACT_ADDRESS_MAINNET = "0xf0d0dF7142f60F7F3847463A509fD8969E3e3A27";
const CONTRACT_ADDRESS_GOERLI = "0xf0d0dF7142f60F7F3847463A509fD8969E3e3A27";

export const CONTRACT_ADDRESS = FORCE_GOERLI_CONTRACTS ? CONTRACT_ADDRESS_GOERLI : CONTRACT_ADDRESS_MAINNET ;

if (!STAY_MYSTERIOUS) {
    console.log(`Contract address (${FORCE_GOERLI_CONTRACTS? "sepolia":"mainnet"}): ${CONTRACT_ADDRESS}`);
    console.log(`https://${FORCE_GOERLI_CONTRACTS?"sepolia.":""}basescan.org/address/${CONTRACT_ADDRESS}`);
}

export const links = {
    discord: "https://discord.gg/KBAbk2a4PM",
    twitter: "https://twitter.com/dailofrog",
    opensea: "https://opensea.io/collection/tinybasedfrogs",
    etherscan: "https://basescan.org/address/0xf0d0dF7142f60F7F3847463A509fD8969E3e3A27#code",
}

/*
// social
import imgSocialOpensea from "../public/socialmedia/opensea.png";
import imgSocialEtherscan from "../public/socialmedia/etherscan.png";
import imgSocialDiscord from "../public/socialmedia/discord.png";
import imgSocialTwitter from "../public/socialmedia/twitter.png";
import imgSocialLooksRare from "../public/socialmedia/looksrare.png";
*/

const Nbsp  = () => '\u00A0';
