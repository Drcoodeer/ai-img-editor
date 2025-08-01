"use client";
import GetUserClient from "@/components/GetUserClient";

export default function WithUserInfo({ children }) {
  return (
    <>
      <GetUserClient />
      {children}
    </>
  );
}
