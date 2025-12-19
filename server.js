const express = require("express");
const path = require("path");
const cors = require("cors");
const Brevo = require("@getbrevo/brevo");

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================
   MIDDLEWARE
============================ */
app.use(cors({
  origin: "https://foodbridge.qzz.io"
}));
app.use(express.json());

/* ============================
   BREVO CONFIG
============================ */
const brevoClient = Brevo.ApiClient.instance;
const apiKey = brevoClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new Brevo.TransactionalEmailsApi();

/* ============================
   EMAIL HELPER
============================ */
async function sendTemplateEmail({ to, templateId, params }) {
  return emailApi.sendTransacEmail({
    sender: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME
    },
    to,
    templateId: Number(templateId),
    params
  });
}

/* ============================
   API: CLAIM FOOD
============================ */
app.post("/api/claim-food", async (req, res) => {
  try {
    const { restaurant, orphanage, food } = req.body;

    await sendTemplateEmail({
      to: [
        { email: restaurant.email, name: restaurant.name },
        { email: orphanage.email, name: orphanage.name }
      ],
      templateId: process.env.CLAIM_TEMPLATE_ID,
      params: {
        food_name: food.name,
        food_quantity: food.quantity,

        restaurant_name: restaurant.name,
        restaurant_phone: restaurant.phone,
        restaurant_address: restaurant.address,

        orphanage_name: orphanage.name,
        orphanage_phone: orphanage.phone,
        orphanage_address: orphanage.address
      }
    });

    console.log("✅ Claim email sent");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Claim email error:", err);
    res.status(500).json({ error: "Failed to send claim email" });
  }
});

/* ============================
   API: CONFIRM RECEIPT
============================ */
app.post("/api/confirm-receipt", async (req, res) => {
  try {
    const { restaurant, orphanage, food } = req.body;

    await sendTemplateEmail({
      to: [
        { email: restaurant.email, name: restaurant.name },
        { email: orphanage.email, name: orphanage.name }
      ],
      templateId: process.env.CONFIRM_TEMPLATE_ID,
      params: {
        food_name: food.name,
        food_quantity: food.quantity,
        orphanage_name: orphanage.name,
        orphanage_address: orphanage.address
      }
    });

    console.log("✅ Confirmation email sent");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Confirm email error:", err);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

/* ============================
   START SERVER
============================ */
app.listen(PORT, () => {
  console.log(`🚀 FoodBridge backend running on port ${PORT}`);
});
