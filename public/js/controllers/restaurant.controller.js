import { createDonation } from "../services/donation.service.js";
import { state } from "../state.js";

/**
 * Entry point for restaurant dashboard
 * Runs AFTER auth + profile are ready
 */
export function initRestaurant() {
  console.log("🍽️ Restaurant controller started");

  console.log("User:", state.authUser);
  console.log("Profile:", state.profile);
  console.log("Location:", state.location);

  bindUI();
}

/* =========================
   UI BINDINGS
========================= */
function bindUI() {
  window.switchTab = switchTab;
  window.logout = logout;

  const form = document.getElementById("donate-form");
  if (form) {
    form.addEventListener("submit", handleDonate);
  }

  switchTab("overview");
}

async function handleDonate(event) {
  event.preventDefault();

  const name = document.getElementById("food-name").value;
  const qty = document.getElementById("food-qty").value;

  if (!name || !qty) {
    alert("Please fill all fields");
    return;
  }

  try {
    await createDonation({
      foodName: name,
      servings: Number(qty),
      restaurantId: state.authUser.uid,
      restaurantName: state.profile.name,
      restaurantEmail: state.profile.email,
      restaurantPhone: state.profile.phone,
      restaurantAddress: state.profile.address,
      location: state.location
    });

    event.target.reset();
    alert("✅ Donation posted");

  } catch (err) {
    console.error(err);
    alert("❌ Failed to post donation");
  }
}

/* =========================
   BASIC FUNCTIONS (TEMP)
========================= */
function switchTab(tab) {
  console.log("Switch tab:", tab);

  ["overview", "history", "details", "alerts"].forEach(t => {
    const el = document.getElementById("tab-" + t);
    if (el) el.classList.add("hidden");
  });

  const active = document.getElementById("tab-" + tab);
  if (active) active.classList.remove("hidden");
}

function logout() {
  state.authUser?.auth?.signOut?.();
  window.location.href = "/login";
}
