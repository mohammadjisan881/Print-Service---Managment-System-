const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/orders/track/ORD-0AE550A6');
    console.log("Status Code:", res.status);
    console.log("Response Data:", res.data);
  } catch(e) {
    if(e.response) {
      console.error("HTTP ERROR:", e.response.status, e.response.data);
    } else {
      console.error("NETWORK ERROR:", e.message);
    }
  }
}
test();
