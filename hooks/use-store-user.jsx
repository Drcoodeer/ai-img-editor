"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function useStoreUser() {
  const { isSignedIn, isLoaded } = useUser();
  const storeUser = useMutation(api.users.store);

  // This prevents re-calling on every render
  const hasStored = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasStored.current) return;

    async function syncUserToConvex() {
      try {
        await storeUser(); // Clerk session is sent automatically
        hasStored.current = true; // ✅ prevent future re-calls
        // console.log("✅ User stored in Convex.");
      } catch (err) {
        console.error("❌ Error storing user:", err);
      }
    }

    syncUserToConvex();
  }, [isLoaded, isSignedIn, storeUser]);
}
