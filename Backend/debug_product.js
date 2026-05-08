const axios = require('axios');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
require('dotenv').config();

const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

async function debug() {
  try {
    const form = new FormData();
    form.append('name', 'sfs');
    form.append('description', 'sdfsdf');
    form.append('base_price', '400');
    form.append('category', 'dff');
    // Not appending image to keep it simple, or we can append a dummy string
    
    const response = await axios.post('http://localhost:5000/api/products', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });
    console.log('Success:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('API Error Response:', err.response.data);
    } else {
      console.error('Request Error:', err.message);
    }
  }
}

debug();
