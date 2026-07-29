import { requireClientContext } from "@/lib/session";
import { getClientBrief } from "@/lib/client-data";
import { Card, Field, TextArea, PrimaryButton } from "@/components/ui";
import { updateBrandingAction } from "@/app/actions/client";

export default async function SettingsPage() {
  const { clientId } = await requireClientContext();
  const client = await getClientBrief(clientId);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Branding & identity">
          <form action={updateBrandingAction} className="space-y-3" encType="multipart/form-data">
            <Field label="Lab name" name="name" defaultValue={client.name} required />
            <Field label="Address" name="address" defaultValue={client.address} />
            <Field label="Phone" name="phone" defaultValue={client.phone} />
            <Field label="Email" name="email" type="email" defaultValue={client.email} />
            <Field label="GSTIN" name="gstin" defaultValue={client.gstin} />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Logo</span>
              {client.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={client.logoUrl} alt="" className="mb-2 max-h-16 object-contain" />
              ) : null}
              <input name="logo" type="file" accept="image/*" className="block w-full text-sm" />
            </label>
            <PrimaryButton>Save branding</PrimaryButton>
          </form>
        </Card>

        <Card title="Invoice & report copy">
          <form action={updateBrandingAction} className="space-y-3">
            <Field
              label="Invoice number prefix"
              name="invoicePrefix"
              defaultValue={client.invoicePrefix}
            />
            <TextArea
              label="Invoice message / terms"
              name="invoiceMessage"
              defaultValue={client.invoiceMessage}
              rows={4}
            />
            <TextArea
              label="Report footer"
              name="reportFooter"
              defaultValue={client.reportFooter}
              rows={4}
            />
            <PrimaryButton>Save messages</PrimaryButton>
          </form>
        </Card>
      </div>
    </>
  );
}
