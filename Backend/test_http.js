const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/orders/debug?status=Pending');
    console.log("Status Code:", res.status);
    console.log("Response Data Length:", res.data.length);
    if(res.data.length > 0) {
      console.log("First item:", JSON.stringify(res.data[0], null, 2));
    } else {
      console.log("Empty Array returned!");
    }
  } catch(e) {
    if(e.response) {
      console.error("HTTP ERROR:", e.response.status, e.response.data);
    } else {
      console.error("NETWORK ERROR:", e.message);
    }
  }
}
test();
