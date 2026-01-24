import { c32addressDecode, c32address } from 'c32check';


export const bytes32FromBytes = (bytes: Uint8Array): `0x${string}` => {
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `0x${hex}`;
};

export const remoteRecipientCoder = {
    encode: (address: string): Uint8Array => {
        // Decode Stacks address to get the hash (version + hash160)
        // c32addressDecode returns [version(int), hash160(string hex)]
        const [, hash160] = c32addressDecode(address);

        // Convert hex hash to bytes
        const hashBytes = Buffer.from(hash160, 'hex');

        // Pad to 32 bytes (Left padding is standard for bytes32 addresses in Solidity usually)
        // However, we need to be careful. 
        // If xReserve expects the 20-byte hash left-padded:
        const padded = new Uint8Array(32);
        padded.set(hashBytes, 32 - hashBytes.length); // Left pad
        return padded;
    },

    decode: (bytes32: string): string => {
        // Remove 0x prefix
        const cleanHex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;

        // Convert to bytes
        const bytes = Buffer.from(cleanHex, 'hex');

        // Remove left padding (unpad)
        // Find first non-zero byte
        let start = 0;
        while (start < bytes.length && bytes[start] === 0) start++;
        const hashBytes = bytes.subarray(start);

        // Reconstruct Stacks address
        // Assuming Testnet (version 26) for "ST" addresses
        // Mainnet is 22 "SP"
        const version = 26;
        return c32address(version, hashBytes.toString('hex'));
    }
};
