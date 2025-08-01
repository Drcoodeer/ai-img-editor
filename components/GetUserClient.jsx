"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function GetUserClient() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return <p className="text-yellow-300">Loading user...</p>; // Query is loading
  }

  if (user === null) {
    return <p className="text-red-400">Not authenticated or user not found.</p>;
  }

  return (
    <div className="p-2 bg-green-800 rounded mt-4">
      <h2 className="text-lg font-bold">Current User:</h2>
      <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
