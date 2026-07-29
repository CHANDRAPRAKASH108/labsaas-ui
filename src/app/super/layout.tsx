import { FlashToast } from "@/components/flash-toast-server";
import { AppChrome } from "@/components/app-chrome";
import { requireSuperAdmin } from "@/lib/session";
import { filterSidebar, SUPER_SIDEBAR } from "@/lib/sidebar-nav";

export default async function SuperSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdmin();
  const sections = filterSidebar(SUPER_SIDEBAR, {
    role: session.role,
  });

  return (
    <AppChrome session={session} sections={sections}>
      {children}
      <FlashToast />
    </AppChrome>
  );
}
