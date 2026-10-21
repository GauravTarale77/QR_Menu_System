"use client";

import { deleteCategory, saveCategory } from "./actions";
import type { Category } from "@/lib/types";

export default function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <details className="rounded-2xl bg-white p-4 ring-1 ring-latte">
      <summary className="cursor-pointer font-medium text-espresso">
        Manage categories ({categories.length})
      </summary>
      <div className="mt-3 space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <form action={saveCategory} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="sort_order"
                type="number"
                defaultValue={c.sort_order}
                className="w-16 rounded-lg bg-cream px-2 py-1.5 text-sm ring-1 ring-latte"
                aria-label="Order"
              />
              <input
                name="name"
                defaultValue={c.name}
                className="min-w-0 flex-1 rounded-lg bg-cream px-3 py-1.5 ring-1 ring-latte"
              />
              <button className="rounded-lg bg-latte px-3 py-1.5 text-sm text-mocha">
                Save
              </button>
            </form>
            <button
              onClick={async () => {
                if (!confirm(`Delete category "${c.name}"?`)) return;
                const res = await deleteCategory(c.id);
                if (res.error) alert(res.error);
              }}
              className="px-2 text-sm text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
        <form action={saveCategory} className="flex gap-2 pt-2">
          <input
            name="name"
            required
            placeholder="New category name"
            className="min-w-0 flex-1 rounded-lg bg-cream px-3 py-1.5 ring-1 ring-latte"
          />
          <button className="rounded-lg bg-mocha px-4 py-1.5 text-sm text-white">
            Add category
          </button>
        </form>
      </div>
    </details>
  );
}