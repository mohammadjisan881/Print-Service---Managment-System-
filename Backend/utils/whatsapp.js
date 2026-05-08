const axios = require('axios');

/**
 * WhatsApp Messaging Utility
 * You can plug in your API details later in this file.
 */
const sendWhatsAppMessage = async (phone, message) => {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiToken = process.env.WHATSAPP_TOKEN;

        if (apiUrl && apiToken) {
            // Real API Call
            await axios.post(apiUrl, {
                token: apiToken,
                to: cleanPhone,
                body: message
            });
            console.log(`[WhatsApp API] Sent to: ${cleanPhone}`);
        } else {
            // Simulation Mode (if env variables are missing)
            console.log(`[WhatsApp Simulation] To: ${cleanPhone} | Message: ${message}`);
            console.log(`[Note] Set WHATSAPP_API_URL and WHATSAPP_TOKEN in .env for real delivery.`);
        }

        return { success: true };
    } catch (err) {
        console.error('WhatsApp API Error:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = { sendWhatsAppMessage };
