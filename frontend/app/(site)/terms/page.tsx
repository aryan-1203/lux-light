import { pageMetadata } from "@/lib/metadata";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata = pageMetadata({
  title: "Terms",
  description: "Terms of use for this website and early access.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
