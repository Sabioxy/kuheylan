"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useSyncExternalStore } from "react";
import { readCart, subscribeCart } from "@/lib/cart";

const EMPTY_CART: string[] = [];

export default function CartLink() {
  const cart = useSyncExternalStore(subscribeCart, readCart, () => EMPTY_CART);
  const itemCount = cart.length;

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-zinc-200/60 bg-white text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
      title="Sepet"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
