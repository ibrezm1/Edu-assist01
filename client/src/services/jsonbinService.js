export const jsonbinService = {
    pushToBin: async (apiKey, binId, dbData) => {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify(dbData)
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
        return data.record;
    }
};
