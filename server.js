const express = require("express");
const cors = require("cors");
const Brevo = require("@getbrevo/brevo");
const admin = require("firebase-admin"); 
const path = require("path");
const fs = require("fs"); 

const app = express();
const PORT = process.env.PORT || 10000;
// --- ADD THIS AI SETUP ---
const OpenAI = require("openai");
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("✅ OpenAI Agent Initialized");
} else {
    console.log("⚠️ OPENAI_API_KEY missing. AI running in Mock Mode.");
}
// -------------------------

/* ============================
   FIREBASE SETUP
============================= */
let db; 

try {
  if (fs.existsSync("./service-account.json")) {
    const serviceAccount = require("./service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore(); 
    console.log("✅ Firebase Admin Initialized");
  } else {
    console.log("⚠️ service-account.json not found. Server-side admin features disabled.");
  }
} catch (error) {
  console.error("❌ Firebase Init Error:", error.message);
}

/* ============================
   MIDDLEWARE
============================ */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

/* ============================
   BREVO EMAIL SENDER
============================ */
async function sendTemplateEmail({ to, templateId, params }) {
  if (!process.env.BREVO_API_KEY) {
      console.log("⚠️ Brevo API Key missing. Skipping email.");
      return;
  }
  const api = new Brevo.TransactionalEmailsApi();
  return api.sendTransacEmail(
    { to, templateId, params },
    { headers: { "api-key": process.env.BREVO_API_KEY } }
  );
}

/* ============================
   API ROUTES
   (Simplified - removed FCM calls)
============================ */

app.post("/api/notify-donation", async (req, res) => {
  // Logic moved to client-side database listeners for simplicity
  res.json({ success: true, message: "Donation logged." });
});

app.post("/api/claim-food", async (req, res) => {
  try {
    const { restaurant, orphanage, food } = req.body;
    if (!restaurant || !orphanage || !food) return res.status(400).json({ error: "Invalid data" });

    await sendTemplateEmail({
      to: [{ email: restaurant.email, name: restaurant.name }, { email: orphanage.email, name: orphanage.name }],
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
    console.error("❌ Claim API Error:", err);
    res.status(500).json({ error: "Email failed" });
  }
});

app.post("/api/confirm-receipt", async (req, res) => {
  try {
    const { restaurant, orphanage, food } = req.body;
    await sendTemplateEmail({
      to: [{ email: restaurant.email, name: restaurant.name }, { email: orphanage.email, name: orphanage.name }],
      templateId: 2,
      params: {
        food_name: food.name,
        food_quantity: food.quantity,
        restaurant_name: restaurant.name,
        orphanage_name: orphanage.name
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Confirm API Error:", err);
    res.status(500).json({ error: "Email failed" });
  }
});
// --- NEW AI CHAT ENDPOINT ---
app.post("/api/chat", async (req, res) => {
    try {
        const { message, role } = req.body;
        
        // 1. Mock Mode (Fallback if no key)
        if (!openai) {
            let reply = "I am a basic bot (Add OpenAI Key to enable real AI).";
            if (message.toLowerCase().includes("hello")) reply = "Hello! How can I help you with FoodBridge?";
            if (message.toLowerCase().includes("donate")) reply = "You can donate food by clicking the 'Donate' button in your dashboard.";
            return res.json({ reply });
        }

        // 2. Real AI Mode
        const systemPrompts = {
            restaurant: "You are a helpful assistant for Restaurant staff using FoodBridge. Help them donate food and track waste.",
            orphanage: "You are a caring assistant for Orphanage staff. Help them find food donations and manage requests.",
            driver: "You are a logistics assistant for Drivers. Help them navigate to pickups and deliveries."
        };

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompts[role] || "You are a helpful assistant." },
                { role: "user", content: message }
            ],
            model: "gpt-3.5-turbo",
        });

        res.json({ reply: completion.choices[0].message.content });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Sorry, I'm having trouble connecting to the brain." });
    }
});
// -----------------------------

app.listen(PORT, () => {
  console.log(`🚀 FoodBridge backend running on port ${PORT}`);
});
