import { c32addressDecode } from 'c32check';

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
        const [version, hash160] = c32addressDecode(address);

        // Convert hex hash to bytes
        const hashBytes = new Uint8Array(
            hash160.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );

        // Pad to 32 bytes (Left pad)
        const padded = new Uint8Array(32);
        padded.set(hashBytes, 32 - hashBytes.length);
        return padded;
    }
};
