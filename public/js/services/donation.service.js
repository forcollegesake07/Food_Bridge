import { db } from "../firebase.js";
import { state } from "../state.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Create a new food donation
 */
export async function createDonation({ foodName, quantity }) {
  if (!state.authUser || !state.profile) {
    throw new Error("User not ready");
  }
  export function listenToMyDonations(callback) {
  if (!state.authUser) return;

  return db
    .collection("donations")
    .where("restaurantId", "==", state.authUser.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      const donations = [];

      snapshot.forEach(doc => {
        donations.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      callback(donations);
    });
}


  const donation = {
    restaurantId: state.authUser.uid,
    restaurantName: state.profile.name || "Unnamed Restaurant",
    restaurantEmail: state.profile.email || "",
    restaurantPhone: state.profile.phone || "",
    restaurantAddress: state.profile.address || "",

    foodName,
    servings: Number(quantity),

    status: "Available",
    createdAt: serverTimestamp(),
    location: state.profile.location || null,
  };

  await db.collection("donations").add(donation);

  return donation;
}
