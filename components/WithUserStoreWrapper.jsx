// components/WithUserStoreWrapper.jsx
"use client";
import ClientUserSync from "@/components/ClientUserSync";

export default function WithUserStoreWrapper({ children }) {
  return (
    <>
      <ClientUserSync />
      {children}
    </>
  );
}
