import { LandingPage } from "@/features/landing/components/landing-page";

// Rendu statique pour visiteurs non connectés (cas le plus fréquent).
// La redirection des utilisateurs connectés est gérée par proxy.ts (edge)
// qui décode le JWT sans appel backend → supprime le TTFB bloquant de /auth/me
// qui causait le LCP à 5.74s quand Render est froid.
export default function Home() {
  return <LandingPage />;
}