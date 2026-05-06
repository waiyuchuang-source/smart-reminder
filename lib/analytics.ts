type TrackAction = "nudge_viewed" | "nudge_clicked" | "task_completed" | "dismissed";

interface TrackEvent {
  userId: string;
  copyId: string;
  tone: string;
  action: TrackAction;
  experimentId?: string;
  variantId?: string;
}

export function trackEvent(event: TrackEvent): void {
  const payload = JSON.stringify(event);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
  } else if (typeof fetch !== "undefined") {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(() => {});
  }
}
