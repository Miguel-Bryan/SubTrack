"use client";

import { login } from "@/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/form";

export function LoginForm() {
  return (
    <ActionForm action={login}>
      <TextField name="username" label="Email or username" autoComplete="username" autoFocus required />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      <SubmitButton pendingText="Signing in...">Sign in</SubmitButton>
    </ActionForm>
  );
}
