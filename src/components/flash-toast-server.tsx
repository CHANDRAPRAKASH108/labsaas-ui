import { peekFlash } from "@/lib/flash";
import { FlashToastClient } from "@/components/flash-toast";

export async function FlashToast() {
  const flash = await peekFlash();
  return (
    <FlashToastClient
      initialMessage={flash?.message ?? null}
      initialTone={flash?.tone ?? "success"}
    />
  );
}
