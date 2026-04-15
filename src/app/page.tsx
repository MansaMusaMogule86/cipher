import WaitlistPage from "@/components/marketing/WaitlistPage";
import LandingPage from "@/components/marketing/LandingPage";

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";

export default function Home() {
  if (WAITLIST_MODE) {
    return <WaitlistPage />;
  }

  return <LandingPage />;
}
