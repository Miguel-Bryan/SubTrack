import type { Metadata } from "next";
import { createClient } from "@/actions/clients";
import { ClientForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Add client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Add client" />
      <Panel className="max-w-2xl p-5">
        <ClientForm action={createClient} cancelHref="/clients" submitLabel="Add client" />
      </Panel>
    </>
  );
}
