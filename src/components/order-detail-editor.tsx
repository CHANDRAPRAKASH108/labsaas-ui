"use client";

import { useState, useTransition } from "react";
import {
  updatePatientAction,
  updateOrderMetaAction,
  addTestsToOrderAction,
  removeOrderItemAction,
} from "@/app/actions/client";
import { Card, TextLink } from "@/components/ui";
import { formatMoney } from "@/lib/billing";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

type OrderItem = {
  id: string;
  price: number;
  sampleKey: string;
  testTemplate: { id: string; name: string; code: string };
};

type AvailableTest = {
  id: string;
  name: string;
  code: string;
  price: number;
};

const ORDER_STATUSES = [
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

function EditToggle({
  editing,
  onEdit,
  onCancel,
  locked,
}: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  locked?: boolean;
}) {
  if (locked) return null;
  if (editing) {
    return (
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-9 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
      >
        Cancel
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onEdit}
      className="inline-flex min-h-9 items-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
    >
      Edit
    </button>
  );
}

function SaveButton({ pending, label = "Save" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-9 items-center rounded-lg bg-emerald-950 px-3 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function OrderDetailEditor({
  orderId,
  patient,
  status,
  notes,
  items,
  availableTests,
  locked,
}: {
  orderId: string;
  patient: Patient;
  status: string;
  notes: string | null;
  items: OrderItem[];
  availableTests: AvailableTest[];
  locked: boolean;
}) {
  const [editPatient, setEditPatient] = useState(false);
  const [editOrder, setEditOrder] = useState(false);
  const [editTests, setEditTests] = useState(false);
  const [pending, startTransition] = useTransition();

  const orderedIds = new Set(items.map((i) => i.testTemplate.id));
  const addableTests = availableTests.filter((t) => !orderedIds.has(t.id));

  return (
    <div className="mb-4 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Patient"
        action={
          <EditToggle
            editing={editPatient}
            onEdit={() => setEditPatient(true)}
            onCancel={() => setEditPatient(false)}
          />
        }
      >
        {editPatient ? (
          <form
            className="space-y-3"
            action={(fd) => {
              startTransition(async () => {
                await updatePatientAction(fd);
                setEditPatient(false);
              });
            }}
          >
            <input type="hidden" name="patientId" value={patient.id} />
            <input type="hidden" name="orderId" value={orderId} />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Name</span>
              <input
                name="name"
                required
                defaultValue={patient.name}
                className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Phone</span>
              <input
                name="phone"
                required
                defaultValue={patient.phone ?? ""}
                className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Address</span>
              <input
                name="address"
                required
                defaultValue={patient.address ?? ""}
                className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
              />
            </label>
            <SaveButton pending={pending} />
          </form>
        ) : (
          <div className="space-y-1">
            <p className="font-medium text-emerald-950">
              <TextLink href={`/app/patients/${patient.id}`}>{patient.name}</TextLink>
            </p>
            <p className="text-sm text-emerald-900/70">{patient.phone || "—"}</p>
            <p className="text-sm text-emerald-900/70">{patient.address || "—"}</p>
          </div>
        )}
      </Card>

      <Card
        title="Order"
        action={
          <EditToggle
            editing={editOrder}
            onEdit={() => setEditOrder(true)}
            onCancel={() => setEditOrder(false)}
            locked={locked}
          />
        }
      >
        {editOrder && !locked ? (
          <form
            className="space-y-3"
            action={(fd) => {
              startTransition(async () => {
                await updateOrderMetaAction(fd);
                setEditOrder(false);
              });
            }}
          >
            <input type="hidden" name="orderId" value={orderId} />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-emerald-950/80">Notes</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={notes ?? ""}
                className="w-full rounded-lg border border-emerald-800/20 bg-white px-3 py-2"
              />
            </label>
            <SaveButton pending={pending} />
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-emerald-900/60">Status:</span>{" "}
              <span className="font-medium text-emerald-950">{status.replaceAll("_", " ")}</span>
            </p>
            <p>
              <span className="text-emerald-900/60">Notes:</span>{" "}
              <span className="text-emerald-950">{notes || "—"}</span>
            </p>
          </div>
        )}
      </Card>
      </div>

      <Card
        title="Ordered tests & sample keys"
        action={
          <EditToggle
            editing={editTests}
            onEdit={() => setEditTests(true)}
            onCancel={() => setEditTests(false)}
            locked={locked}
          />
        }
      >
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-emerald-800/10 bg-emerald-50/40 px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:gap-3"
            >
              <span className="min-w-0">
                <span className="font-medium text-emerald-950">{item.testTemplate.name}</span>{" "}
                <span className="text-emerald-900/55">({item.testTemplate.code})</span>
              </span>
              <span className="font-mono text-sm font-semibold tracking-wider text-emerald-950">
                Sample #{item.sampleKey}
              </span>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="tabular-nums text-emerald-900/70">{formatMoney(item.price)}</span>
                {editTests && !locked && items.length > 1 ? (
                  <form
                    action={(fd) => {
                      startTransition(async () => {
                        await removeOrderItemAction(fd);
                      });
                    }}
                  >
                    <input type="hidden" name="orderId" value={orderId} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="text-sm font-medium text-rose-700 hover:underline disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {editTests && !locked ? (
          <form
            className="mt-4 space-y-3 border-t border-emerald-800/10 pt-4"
            action={(fd) => {
              startTransition(async () => {
                await addTestsToOrderAction(fd);
                setEditTests(false);
              });
            }}
          >
            <input type="hidden" name="orderId" value={orderId} />
            <p className="text-sm font-medium text-emerald-950">Add tests</p>
            {addableTests.length === 0 ? (
              <p className="text-sm text-emerald-900/60">All active tests are already on this order.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-emerald-800/15 bg-white p-3">
                {addableTests.map((test) => (
                  <li key={test.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" name="testIds" value={test.id} className="rounded border-emerald-800/30" />
                      <span className="min-w-0 flex-1">
                        {test.name} <span className="text-emerald-900/55">({test.code})</span>
                      </span>
                      <span className="tabular-nums text-emerald-900/70">{formatMoney(test.price)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {addableTests.length > 0 ? <SaveButton pending={pending} label="Add selected" /> : null}
          </form>
        ) : null}
      </Card>
    </div>
  );
}
