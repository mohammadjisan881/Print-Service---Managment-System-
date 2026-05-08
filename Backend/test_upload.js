const axios = require('axios');
const FormData = require('form-data');

async function test() {
  try {
    const form = new FormData();
    form.append('name', 'Test Service');
    form.append('description', 'Test Description');
    form.append('base_price', '500');
    form.append('category', 'Test');
    
    // We send without file first. Wait, we need an admin token.
    // Instead of logging in, I can just check if uploads dir exists.
    const fs = require('fs');
    if (!fs.existsSync('uploads')) {
      console.log('Uploads directory does NOT exist.');
    } else {
      console.log('Uploads directory exists.');
    }
  } catch (err) {
    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
