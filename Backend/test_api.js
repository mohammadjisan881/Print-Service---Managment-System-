const axios = require('axios');
async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/cost-presets', {
            name: 'Test Preset',
            amount: 100,
            unit: 'Piece'
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.log("Error Status:", e.response?.status);
        console.log("Error Data:", e.response?.data);
    }
}
test();
