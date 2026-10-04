import type { Metadata } from "next";
import { createUser } from "@/actions/users";
import { UserForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Add user" };

export default async function NewUserPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add user" />
      <Panel className="max-w-2xl p-5">
        <UserForm action={createUser} cancelHref="/users" submitLabel="Add user" />
      </Panel>
    </>
  );
}
