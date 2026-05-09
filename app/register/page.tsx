"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="h-16 w-16 overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Kayıt
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Kullanıcı adı + e-posta ile hesap oluştur.
        </p>
      </header>

      <div className="mt-8 rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;

            setSubmitting(true);
            setError(null);

            try {
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username,
                  email,
                  name: name.trim() ? name : undefined,
                  password,
                  isArtist,
                }),
              });

              if (!res.ok) {
                const msg = await res
                  .json()
                  .then((j: unknown) => {
                    if (!j || typeof j !== "object") return "";
                    const e = (j as Record<string, unknown>).error;
                    return typeof e === "string" ? e : "";
                  })
                  .catch(() => "");
                setError(msg || "Kayıt başarısız");
                setSubmitting(false);
                return;
              }

              router.push("/");
              router.refresh();
            } catch {
              setError("Ağ hatası");
              setSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Kullanıcı adı
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-50 dark:ring-white/20"
              placeholder="ornek_kullanici"
              required
            />
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              3-20 karakter, sadece harf/rakam/alt çizgi.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              inputMode="email"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-50 dark:ring-white/20"
              placeholder="ornek@site.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Ad (opsiyonel)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-50 dark:ring-white/20"
              placeholder="Ad Soyad"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Şifre
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-50 dark:ring-white/20"
              placeholder="en az 8 karakter"
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="is-artist"
              type="checkbox"
              checked={isArtist}
              onChange={(e) => setIsArtist(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-white/10 dark:bg-zinc-950/40 dark:checked:bg-zinc-50"
            />
            <label htmlFor="is-artist" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Şarkıcı olarak kayıt ol
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200/60 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-200/10 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            <UserPlus className="h-4 w-4" /> Kayıt Ol
          </button>

          <div className="pt-2 text-center text-xs text-zinc-600 dark:text-zinc-300">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
              Giriş yap
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
