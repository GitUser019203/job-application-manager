export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any, // Cast to any or BufferSource to satisfy TS
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptData = async (data: any, key: CryptoKey): Promise<{ iv: number[]; content: number[] }> => {
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encoded
    );

    return {
        iv: Array.from(iv),
        content: Array.from(new Uint8Array(encrypted)),
    };
};

export const decryptData = async (encryptedData: { iv: number[]; content: number[] }, key: CryptoKey): Promise<any> => {
    const iv = new Uint8Array(encryptedData.iv);
    const content = new Uint8Array(encryptedData.content);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        content
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
};
