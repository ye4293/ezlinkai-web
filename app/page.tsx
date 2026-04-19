import React from 'react';
import {
  LandingNav,
  LandingHero,
  LandingMarquee,
  LandingStatement,
  LandingModelsCompact,
  LandingPillars,
  LandingApps,
  LandingTrust,
  LandingFinalCta,
  LandingFooter
} from '@/components/landing/v3';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Grain overlay — fixed, ignored by pointer events */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] opacity-60 dark:opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '3px 3px'
        }}
      />

      <div className="relative z-[2]">
        <LandingNav />
        <LandingHero />
        <LandingMarquee />
        <LandingStatement />
        <LandingModelsCompact />
        <LandingPillars />
        <LandingApps />
        <LandingTrust />
        <LandingFinalCta />
        <LandingFooter />
      </div>
    </div>
  );
}
