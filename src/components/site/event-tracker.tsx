"use client";
import { useEffect } from "react";

type EventName = "product_view" | "project_view" | "quote_started" | "whatsapp_click" | "phone_click";
export function EventTracker({ eventName, entityType, entityId }: { eventName: EventName; entityType?: string; entityId?: string | number }) {
  useEffect(() => {
    if (localStorage.getItem("rackstack_cookie_consent") !== "all") return;
    const controller = new AbortController();
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, entityType, entityId: entityId == null ? undefined : String(entityId), path: location.pathname, consent: "all" }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [eventName, entityType, entityId]);
  return null;
}
