const axios = require('axios');

const sendOrderConfirmation = async (orderData, overridePhone = null) => {
    try {
        const { user, items, totalAmount, shippingAddress, _id, createdAt } = orderData;
        const userName = user.name || "Customer";
        // Ensure mobile number is in format "91XXXXXXXXXX"
        // Use overridePhone if provided, otherwise fallback to user.phone
        let rawPhone = overridePhone || user.phone;
        let userMobile = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';

        // If number starts with '0', remove it
        if (userMobile.startsWith('0')) userMobile = userMobile.substring(1);
        // If number doesn't check '91' but is 10 digits, add '91'
        if (userMobile.length === 10) userMobile = '91' + userMobile;

        if (!userMobile) {
            console.warn("WhatsApp Service: No valid mobile number for user", user._id);
            return;
        }

        const itemsList = items.map(item => {
            const variantText = item.unit ? `(${item.unit})` : '';
            return `• ${item.product.name} ${variantText} × ${item.quantity} – ₹${item.price}`;
        }).join('\n');

        const messageBody = `🛒 *New Grocery Order Placed*

👤 *Customer Details:*
Name: ${userName}
Mobile: +${userMobile}

📦 *Order Items:*
${itemsList}

💰 *Total Amount:* ₹${totalAmount}

📍 *Delivery Address:*
${shippingAddress}

🕒 *Order Time:*
${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

👉 Please reply *CONFIRM* to confirm your order.
Thank you for choosing us 😊`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: userMobile,
            type: "text",
            text: {
                preview_url: false,
                body: messageBody
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("WhatsApp Message Sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("WhatsApp Service Error:", error.response ? error.response.data : error.message);
        // Don't throw error to prevent blocking order flow
    }
};

module.exports = { sendOrderConfirmation };
