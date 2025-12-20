import {
  createDonation,
  listenToMyDonations
} from "../services/donation.service.js";

import { state } from "../state.js";
import { saveProfile } from "../services/profile.service.js";
import { db } from "../firebase.js";

import {
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* =====================================================
   MAP STATE
===================================================== */
let map = null;
let marker = null;

/* expose for inline onclick */
window.claimRequest = claimRequest;

/* =====================================================
   ENTRY POINT
===================================================== */
export function initRestaurant() {
  console.log("🍽️ Restaurant controller started");

  hydrateProfileUI();
  bindUI();
  bindProfileForm();

  listenToMyDonations(donations => {
    renderDonations(donations);
    renderHistory(donations);
  });

  listenToUrgentRequests();
}

/* =====================================================
   PROFILE HYDRATION
===================================================== */
function hydrateProfileUI() {
  document.getElementById("sidebar-name").textContent =
    state.profile.name || "Restaurant";

  document.getElementById("sidebar-id").textContent =
    "ID: " + state.authUser.uid.slice(0, 6);

  document.getElementById("detail-name").value = state.profile.name || "";
  document.getElementById("detail-phone").value = state.profile.phone || "";
  document.getElementById("detail-address").value = state.profile.address || "";
}

/* =====================================================
   PROFILE SAVE
===================================================== */
function bindProfileForm() {
  const form = document.querySelector("#tab-details form");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    if (!state.location.lat || !state.location.lng) {
      alert("Please pin your location on the map");
      return;
    }

    await saveProfile({
      name: document.getElementById("detail-name").value.trim(),
      phone: document.getElementById("detail-phone").value.trim(),
      address: document.getElementById("detail-address").value.trim(),
      location: state.location
    });

    alert("✅ Profile saved");
  });
}

/* =====================================================
   MAP
===================================================== */
function initMap() {
  if (map) return;

  const lat = state.location.lat ?? 20.5937;
  const lng = state.location.lng ?? 78.9629;

  map = L.map("map-container").setView([lat, lng], state.location.lat ? 14 : 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  marker = L.marker([lat, lng], { draggable: true }).addTo(map);

  marker.on("dragend", () => {
    const pos = marker.getLatLng();
    state.location.lat = pos.lat;
    state.location.lng = pos.lng;
  });

  if (!state.location.lat) {
    map.locate({ setView: true });
    map.on("locationfound", e => {
      marker.setLatLng(e.latlng);
      state.location.lat = e.latlng.lat;
      state.location.lng = e.latlng.lng;
    });
  }
}

/* =====================================================
   DONATIONS
===================================================== */
async function handleDonateSubmit(e) {
  e.preventDefault();

  await createDonation({
    foodName: document.getElementById("food-name").value.trim(),
    quantity: document.getElementById("food-qty").value.trim()
  });

  e.target.reset();
}

function renderDonations(donations) {
  const c = document.getElementById("scheduled-pickups-container");
  c.innerHTML = "";

  if (!donations.length) {
    c.innerHTML = "No active listings.";
    return;
  }

  donations.forEach(d => {
    c.innerHTML += `
      <div>
        <b>${d.foodName}</b> – ${d.servings} (${d.status})
      </div>
    `;
  });
}

function renderHistory(donations) {
  const body = document.getElementById("history-table-body");
  body.innerHTML = "";

  donations.forEach(d => {
    body.innerHTML += `
      <tr>
        <td>${d.foodName}</td>
        <td>${d.servings}</td>
        <td>${d.status}</td>
      </tr>
    `;
  });
}

/* =====================================================
   URGENT REQUESTS
===================================================== */
function listenToUrgentRequests() {
  const container = document.getElementById("requests-container");

  db.collection("requests")
    .where("status", "==", "Pending")
    .onSnapshot(snap => {
      container.innerHTML = "";

      snap.forEach(doc => {
        const r = doc.data();

        container.innerHTML += `
          <div>
            <b>${r.itemNeeded}</b> – ${r.quantity}
            <button onclick="claimRequest(
              '${doc.id}',
              '${r.itemNeeded}',
              '${r.quantity}',
              '${r.orphanageId}',
              '${r.orphanageName}'
            )">Donate</button>
          </div>
        `;
      });
    });
}

/* =====================================================
   CLAIM REQUEST (STEP 13 + 14)
===================================================== */
async function claimRequest(
  requestId,
  itemNeeded,
  quantity,
  orphanageId,
  orphanageName
) {
  const reqSnap = await db.collection("requests").doc(requestId).get();
  const reqData = reqSnap.data();

  const mapsLink =
    `https://www.google.com/maps/dir/?api=1&origin=${state.location.lat},${state.location.lng}` +
    `&destination=${reqData.location.lat},${reqData.location.lng}`;

  try {
    // 1️⃣ update request
    await db.collection("requests").doc(requestId).update({
      status: "Fulfilled",
      fulfilledBy: state.authUser.uid,
      fulfilledAt: serverTimestamp()
    });

    // 2️⃣ create donation
    await db.collection("donations").add({
      restaurantId: state.authUser.uid,
      restaurantName: state.profile.name,
      restaurantEmail: state.profile.email,
      restaurantPhone: state.profile.phone,
      restaurantAddress: state.profile.address,

      orphanageId,
      orphanageName,
      orphanageEmail: reqData.orphanageEmail,

      foodName: itemNeeded,
      servings: Number(quantity),

      status: "Claimed",
      createdAt: serverTimestamp(),

      mapsLink,
      emailSent: false
    });

    // 3️⃣ EMAIL (STEP 14)
    await fetch("/api/send-fulfillment-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donation: {
          foodName: itemNeeded,
          servings: Number(quantity),
          restaurantName: state.profile.name,
          restaurantEmail: state.profile.email,
          restaurantPhone: state.profile.phone,
          restaurantAddress: state.profile.address,
          orphanageName,
          orphanageEmail: reqData.orphanageEmail,
          mapsLink
        }
      })
    });

    alert("✅ Request claimed & email sent");

  } catch (err) {
    console.error(err);
    alert("❌ Claim failed");
  }
}

/* =====================================================
   UI
===================================================== */
function bindUI() {
  document
    .getElementById("donation-form")
    ?.addEventListener("submit", handleDonateSubmit);

  window.switchTab = tab => {
    ["overview", "history", "details", "alerts"].forEach(t =>
      document.getElementById("tab-" + t)?.classList.add("hidden")
    );

    document.getElementById("tab-" + tab)?.classList.remove("hidden");

    if (tab === "details") setTimeout(initMap, 200);
  };

  window.logout = () => {
    state.authUser.auth.signOut();
    window.location.href = "/login";
  };

  switchTab("overview");
}
