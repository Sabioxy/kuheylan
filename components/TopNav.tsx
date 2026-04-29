import Link from "next/link";
import { Heart, LogIn, LogOut, Music2, Store, UserPlus } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";

export default async function TopNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            <Music2 className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Küheylan
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Lisans Pazaryeri</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 sm:inline-flex">
                @{user.username}
              </div>

              <Link
                href="/library"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                Kütüphane
              </Link>

              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  Admin Panel
                </Link>
              ) : null}

              {user.role === "ARTIST" ? (
                <Link
                  href="/artist-admin"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  Şarkıcı Paneli
                </Link>
              ) : null}

              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" /> Çıkış
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" /> Giriş
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                <UserPlus className="h-4 w-4" /> Kayıt
              </Link>
            </>
          )}

          <Link
            href="/favorites"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            <Heart className="h-4 w-4" /> Favoriler
          </Link>

          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            <Store className="h-4 w-4" /> Satış Yeri
          </Link>
        </nav>
      </div>
    </header>
  );
}
