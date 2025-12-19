const express = require("express");
const path = require("path");
const cors = require("cors");
const Brevo = require("@getbrevo/brevo");

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================
   MIDDLEWARE
============================ */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ============================
   BREVO CONFIG (CORRECT WAY)
============================ */
const brevoClient = Brevo.ApiClient.instance;
const apiKey = brevoClient.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new Brevo.TransactionalEmailsApi();

console.log("BREVO KEY EXISTS:", !!process.env.BREVO_API_KEY);

/* ============================
   EMAIL HELPER
============================ */
async function sendTemplateEmail({ to, templateId, params }) {
  return emailApi.sendTransacEmail({
    to,
    templateId,
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
      templateId: 1,
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

    res.json({ success: true });
  } catch (err) {
    console.error("BREVO ERROR:", err.response?.body || err);
    res.status(500).json({ error: "Email failed" });
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
      templateId: 2,
      params: {
        food_name: food.name,
        food_quantity: food.quantity,
        orphanage_name: orphanage.name
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("BREVO ERROR:", err.response?.body || err);
    res.status(500).json({ error: "Email failed" });
  }
});

app.listen(PORT, () => {
  console.log(`FoodBridge backend running on port ${PORT}`);
});
