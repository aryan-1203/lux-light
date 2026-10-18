import { pageMetadata } from "@/lib/metadata";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What data we collect when you join early access, why, and your rights under India's DPDP Act, 2023.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
