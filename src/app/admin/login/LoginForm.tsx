"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-espresso">
          Admin ID
        </span>
        <input
          name="id"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl bg-white px-4 py-3 ring-1 ring-latte outline-none focus:ring-caramel"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-espresso">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl bg-white px-4 py-3 ring-1 ring-latte outline-none focus:ring-caramel"
        />
      </label>
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-caramel py-3 font-semibold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}