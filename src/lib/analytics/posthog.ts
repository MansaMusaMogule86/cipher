import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

let initialised = false;

function init() {
  if (initialised || typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // we fire these manually
    autocapture: false,
    persistence: "localStorage",
  });
  initialised = true;
}

export function trackVisitor({ page, referrer }: { page: string; referrer?: string }) {
  init();
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.capture("$pageview", {
    $current_url: window.location.href,
    page,
    referrer: referrer ?? document.referrer,
  });
}

export function trackButtonClick(label: string, props?: Record<string, unknown>) {
  init();
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.capture("button_click", { label, ...props });
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  init();
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.capture(event, props);
}
