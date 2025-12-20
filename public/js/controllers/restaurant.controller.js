import {
  createDonation,
  listenToMyDonations
} from "../services/donation.service.js";
import { state } from "../state.js";
import { saveProfile } from "../services/profile.service.js";

/**
 * Entry point for restaurant dashboard
 * Runs AFTER auth + profile are ready
 */
export function initRestaurant() {
  console.log("🍽️ Restaurant controller started");

  console.log("User:", state.authUser);
  console.log("Profile:", state.profile);
  console.log("Location:", state.location);

  hydrateProfileUI();
  bindUI();
  bindProfileForm();

  listenToMyDonations(donations => {
    renderDonations(donations); // ✅ FIXED
    renderHistory(donations);
  });
}
function hydrateProfileUI() {
  // Sidebar
  const nameEl = document.getElementById("sidebar-name");
  const idEl = document.getElementById("sidebar-id");

  if (nameEl) nameEl.textContent = state.profile.name || "Restaurant";
  if (idEl) idEl.textContent = "ID: " + state.authUser.uid.slice(0, 6);

  // Details tab inputs
  const nameInput = document.getElementById("detail-name");
  const phoneInput = document.getElementById("detail-phone");
  const addressInput = document.getElementById("detail-address");

  if (nameInput) nameInput.value = state.profile.name || "";
  if (phoneInput) phoneInput.value = state.profile.phone || "";
  if (addressInput) addressInput.value = state.profile.address || "";
}
function renderHistory(donations) {
  const body = document.getElementById("history-table-body");
  const countEl = document.getElementById("history-count");

  if (!body) return;

  body.innerHTML = "";
  countEl.textContent = donations.length;

  if (donations.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-gray-400">
          No donation history yet
        </td>
      </tr>
    `;
    return;
  }

  donations.forEach(d => {
    const date = d.createdAt?.toDate
      ? d.createdAt.toDate().toLocaleDateString()
      : "—";

    body.innerHTML += `
      <tr class="border-b text-sm">
        <td class="px-4 py-3">${date}</td>
        <td class="px-4 py-3 font-semibold">${d.foodName}</td>
        <td class="px-4 py-3">${d.servings}</td>
        <td class="px-4 py-3">${d.status}</td>
        <td class="px-4 py-3">${d.orphanageName || "-"}</td>
        <td class="px-4 py-3">${d.orphanagePhone || "-"}</td>
        <td class="px-4 py-3 text-center">—</td>
      </tr>
    `;
  });
}

function bindProfileForm() {
  const form = document.getElementById("profile-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("detail-name")?.value.trim();
    const phone = document.getElementById("detail-phone")?.value.trim();
    const address = document.getElementById("detail-address")?.value.trim();

    if (!name || !phone || !address) {
      alert("Please fill all profile fields");
      return;
    }

    try {
      await saveProfile({
        name,
        phone,
        address,
        location: state.location || null
      });

      // Update sidebar instantly
      const sidebarName = document.getElementById("sidebar-name");
      if (sidebarName) sidebarName.textContent = name;

      alert("✅ Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save profile");
    }
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
