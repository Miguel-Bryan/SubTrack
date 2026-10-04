import type { Metadata } from "next";
import { createProvider } from "@/actions/providers";
import { ProviderForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { PLATFORM_SUGGESTIONS } from "@/lib/constants";
import { toInputDate, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Add provider subscription" };

export default function NewProviderPage() {
  return (
    <>
      <PageHeader title="Add provider subscription" description="A subscription we buy and resell seats of." />
      <Panel className="max-w-2xl p-5">
        <ProviderForm action={createProvider} cancelHref="/providers" submitLabel="Add provider subscription" todayValue={toInputDate(today())} platforms={PLATFORM_SUGGESTIONS} />
      </Panel>
    </>
  );
}
