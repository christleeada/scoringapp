export const checkTokenValidity = async (token: string): Promise<boolean> => {
    try {
        const response = await fetch('https://mis.foundationu.com/api/score/admin-login-check', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
        });
// console.log(token)
        return response.ok;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};
