export const checkTokenValidity = async (token: string): Promise<{ valid: boolean, data?: any }> => {
    try {
        const response = await fetch('https://mis.foundationu.com/api/score/judge-login-check', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
        });

        const responseData = await response.json();
        // console.log('Response data:', responseData);

        return { valid: response.ok, data: responseData };
    } catch (error) {
        console.error('Error:', error);
        return { valid: false };
    }
};
