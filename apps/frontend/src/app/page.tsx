import {
  Cta,
  Faq,
  Features,
  Gallery,
  Hero,
  MarketingFooter,
  MarketingNav,
} from '@/components/marketing';

/**
 * Marketing / landing page.
 *
 * Structure:
 *   - Sticky nav
 *   - Hero with prompt-style CTA
 *   - Feature carousel (4 pillars)
 *   - Gallery of example apps
 *   - FAQ
 *   - Bottom CTA
 *   - Footer
 *
 * Note: no pricing section — this is a hackathon demo, not a SaaS.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-night-900 text-white">
      <MarketingNav />
      <main>
        <Hero />
        <Features />
        <Gallery />
        <Faq />
        <Cta />
      </main>
      <MarketingFooter />
    </div>
  );
}
