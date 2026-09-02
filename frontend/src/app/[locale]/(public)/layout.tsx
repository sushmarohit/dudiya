import { PublicFooter } from "@/components/layouts/public-footer";
import { PublicHeader } from "@/components/layouts/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--brand-milk)] text-[var(--brand-ink)]">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
