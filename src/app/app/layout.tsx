import { FlashToast } from "@/components/flash-toast-server";
import { AppChrome } from "@/components/app-chrome";
import { requireClientContext } from "@/lib/session";
import { getClientName } from "@/lib/client-data";
import { canAccessScreen, DEFAULT_STAFF_SCREENS } from "@/lib/nav";
import {
  filterSidebar,
  flatNavFromSidebar,
  LAB_SIDEBAR,
  type EnabledModules,
} from "@/lib/sidebar-nav";
import { getAllowedScreens } from "@/lib/user-access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/** Module features not in DB yet — off by default; admins still see Soon items. */
const DEFAULT_MODULES: EnabledModules = {
  inventory: false,
  doctor: false,
  prescriptions: false,
  appointments: false,
};

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const { session, clientId } = await requireClientContext();
  const clientName = await getClientName(clientId);
  const impersonating = Boolean(session.impersonatingClientId);

  const allowedScreens =
    session.role === "STAFF" && !impersonating
      ? await getAllowedScreens(session.id)
      : null;

  const sections = filterSidebar(LAB_SIDEBAR, {
    role: session.role,
    impersonating,
    allowedScreens,
    modules: DEFAULT_MODULES,
  });

  const flatNav = flatNavFromSidebar(sections);

  const pathname = (await headers()).get("x-pathname") || "/app";
  if (
    !canAccessScreen({
      role: session.role,
      impersonating,
      allowedScreens:
        allowedScreens && allowedScreens.length > 0
          ? allowedScreens
          : DEFAULT_STAFF_SCREENS,
      pathname,
    })
  ) {
    redirect(flatNav[0]?.href || "/login");
  }

  return (
    <AppChrome session={session} clientName={clientName} sections={sections}>
      {children}
      <FlashToast />
    </AppChrome>
  );
}
