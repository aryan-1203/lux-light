import { siteConfig } from "@/site.config";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/hero/Hero";
import { Problem } from "@/components/sections/Problem";
import { MeetTheLamp } from "@/components/sections/MeetTheLamp";
import { TryTheLight } from "@/components/sections/TryTheLight";
import { Ritual } from "@/components/sections/Ritual";
import { DayWithLight } from "@/components/sections/DayWithLight";
import { Comparison } from "@/components/sections/Comparison";
import { Stories } from "@/components/sections/Stories";
import { FromJournal } from "@/components/sections/FromJournal";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { EarlyAccessCta } from "@/components/sections/EarlyAccessCta";

export const metadata = {
  ...pageMetadata({ title: siteConfig.tagline, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.brandName} · ${siteConfig.tagline}` },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <MeetTheLamp />
      <TryTheLight />
      <Ritual />
      <DayWithLight />
      <Comparison />
      <Stories />
      <FromJournal />
      <HomeFaq />
      <EarlyAccessCta />
    </>
  );
}
