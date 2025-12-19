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

  switchTab("overview");
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
