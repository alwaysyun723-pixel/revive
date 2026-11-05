import React from "react";
import { getDatabase } from "@/lib/db";
import PrivateGatewayView from "@/components/PrivateGatewayView";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDatabase();

  return <PrivateGatewayView db={db} />;
}
