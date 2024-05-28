import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

import {cleanedAddresses} from './_addresses'


export function merkleRoot() {
    const resultMerkleTree = new MerkleTree(cleanedAddresses, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });

    const resultMerkleRoot = resultMerkleTree.getHexRoot();
    return resultMerkleRoot;
}

export function merkleLeafHex(address) {
    return "0x" + keccak256(address).toString('hex');
}

export function merkleLeaf(address) {
    return keccak256(address);
}

export function merkleProof(address) {
    const merkleTree = new MerkleTree(cleanedAddresses, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });

    const leaf = merkleLeaf(address);
    const resultMerkleProof = merkleTree.getHexProof(leaf);
    return resultMerkleProof;
}

export function merkleCheckAddress(address) {
    const merkleTree = new MerkleTree(cleanedAddresses, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });

    const resultMerkleRoot = merkleTree.getHexRoot();

    const leaf = merkleLeaf(address);
    const resultMerkleProof = merkleTree.getHexProof(leaf);
    const verifyResult = merkleTree.verify(resultMerkleProof, leaf, resultMerkleRoot);
    return verifyResult;
}

export function containsAddressInList(address) {
    const addressLowerCase = address.toLowerCase();
    return cleanedAddresses.includes(addressLowerCase);
}