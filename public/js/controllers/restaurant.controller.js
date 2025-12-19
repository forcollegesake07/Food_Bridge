import {
  createDonation,
  listenToMyDonations
} from "../services/donation.service.js";
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

  // 🔥 Live donations listener
  listenToMyDonations(donations => {
    renderDonations(donations);
  });
}

/* =========================
   UI BINDINGS
========================= */
function bindUI() {
  window.switchTab = switchTab;
  window.logout = logout;

  const donateForm = document.getElementById("donation-form");
  if (donateForm) {
    donateForm.addEventListener("submit", handleDonateSubmit);
  }

  switchTab("overview");
}

/* =========================
   DONATION HANDLER
========================= */
async function handleDonateSubmit(e) {
  e.preventDefault();

  const foodName = document.getElementById("food-name")?.value.trim();
  const quantity = document.getElementById("food-qty")?.value.trim();

  if (!foodName || !quantity) {
    alert("Please fill all fields");
    return;
  }

  try {
    await createDonation({ foodName, quantity });
    e.target.reset();
    console.log("✅ Donation created");
  } catch (err) {
    console.error("❌ Donation failed", err);
    alert(err.message || "Failed to create donation");
  }
}

/* =========================
   RENDER DONATIONS (OVERVIEW)
========================= */
function renderDonations(donations) {
  const container = document.getElementById("scheduled-pickups-container");
  if (!container) return;

  container.innerHTML = "";

  if (donations.length === 0) {
    container.innerHTML = `
      <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center text-orange-600 text-sm font-medium">
        No active listings. Post a donation!
      </div>
    `;
    return;
  }

  donations.forEach(d => {
    const statusColor =
      d.status === "Available"
        ? "border-brand-orange"
        : "border-green-500";

    const title =
      d.status === "Available"
        ? "Available Listing"
        : "Pickup Scheduled";

    container.innerHTML += `
      <div class="bg-white rounded-2xl p-6 shadow-xl border-l-4 ${statusColor}">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
        <p class="font-medium">${d.foodName}</p>
        <p class="text-sm text-gray-500">${d.servings} servings</p>
        <p class="text-xs mt-2 text-gray-400">Status: ${d.status}</p>
      </div>
    `;
  });
}

/* =========================
   BASIC NAV
========================= */
function switchTab(tab) {
  ["overview", "history", "details", "alerts"].forEach(t => {
    document.getElementById("tab-" + t)?.classList.add("hidden");
  });

  document.getElementById("tab-" + tab)?.classList.remove("hidden");
}

function logout() {
  state.authUser?.auth?.signOut?.();
  window.location.href = "/login";
}
