const canCompress = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

const compressData = async (stringData) => {
    const stream = new Blob([stringData]).stream().pipeThrough(new CompressionStream('gzip'));
    const response = new Response(stream);
    const buffer = await response.arrayBuffer();
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
};

const decompressData = async (base64Data) => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(stream);
    return await response.text();
};

export const jsonbinService = {
    pushToBin: async (apiKey, binId, dbData) => {
        let payload;
        if (canCompress) {
            try {
                const jsonStr = JSON.stringify(dbData);
                const compressedBase64 = await compressData(jsonStr);
                payload = {
                    compressed: true,
                    data: compressedBase64
                };
            } catch (err) {
                console.warn("Compression failed, falling back to raw JSON push:", err);
                payload = dbData;
            }
        } else {
            payload = dbData;
        }

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JSONBin error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    },

    retrieveFromBin: async (apiKey, binId) => {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': apiKey
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JSONBin error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (!data || !data.record) {
            throw new Error("Invalid response format: missing record data.");
        }

        const record = data.record;
        if (record && record.compressed && typeof record.data === 'string') {
            if (!canCompress) {
                throw new Error("This browser does not support DecompressionStream to read compressed cloud sync data. Please use a modern browser.");
            }
            try {
                const decompressedText = await decompressData(record.data);
                return JSON.parse(decompressedText);
            } catch (err) {
                throw new Error(`Decompression failed: ${err.message}`);
            }
        }
        return record;
    }
};
