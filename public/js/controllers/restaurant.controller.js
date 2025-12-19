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
  listenToMyDonations(renderDonations);

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
function handleDonateSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("food-name");
  const qtyInput = document.getElementById("food-qty");

  const foodName = nameInput.value.trim();
  const quantity = qtyInput.value.trim();

  if (!foodName || !quantity) {
    console.warn("Missing food details");
    return;
  }

  console.log("🍛 Donation Form Submitted");
  console.log("Food:", foodName);
  console.log("Quantity:", quantity);

  // TEMP: reset form (no DB yet)
  e.target.reset();
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

function logout() {
  state.authUser?.auth?.signOut?.();
  window.location.href = "/login";
}
