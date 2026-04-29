"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, Gift } from "lucide-react";

import { readCart, subscribeCart, removeFromCart, clearCart, EMPTY_CART } from "@/lib/cart";
import Link from "next/link";

type CartTrack = {
  id: string;
  name: string;
  effectivePriceCents: number;
  coverImageUrl: string | null;
  artist: { name: string };
  isOwned?: boolean;
};

function formatTRYFromCents(cents: number) {
  const value = cents / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CartPage() {
  const router = useRouter();
  const cartIds = useSyncExternalStore(subscribeCart, readCart, () => EMPTY_CART);
  const [tracks, setTracks] = useState<CartTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gift state
  const [isGifting, setIsGifting] = useState(false);
  const [giftUsername, setGiftUsername] = useState("");

  // Payment state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  useEffect(() => {
    async function fetchCartTracks() {
      if (cartIds.length === 0) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: cartIds }),
        });
        const data = await res.json();
        if (data.tracks) {
          // Sort by cart addition order
          const sorted = [...data.tracks].sort(
            (a, b) => cartIds.indexOf(a.id) - cartIds.indexOf(b.id)
          );
          setTracks(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch cart tracks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCartTracks();
  }, [cartIds]);

  const totalCents = tracks.reduce((acc, t) => acc + t.effectivePriceCents, 0);
  const hasOwnedTracks = tracks.some((t) => t.isOwned);

  // Otomatik olarak sadece hediye moduna zorla (eğer sahip olduğu şarkı varsa)
  useEffect(() => {
    if (hasOwnedTracks && !isGifting) {
      setIsGifting(true);
    }
  }, [hasOwnedTracks, isGifting]);

  async function handleCheckout() {
    if (isGifting && !giftUsername.trim()) {
      setError("Lütfen hediye edilecek kullanıcının adını girin.");
      return;
    }

    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length !== 16 || !/^\d+$/.test(rawCard)) {
      setError("Kart numarası 16 haneli rakamlardan oluşmalıdır.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError("Geçerli bir Son Kullanma Tarihi girin (AA/YY).");
      return;
    }

    const [monthStr, yearStr] = expiry.split("/");
    const expYear = parseInt("20" + yearStr, 10);
    const expMonth = parseInt(monthStr, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      setError("Kartınızın son kullanma tarihi geçmiş.");
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setError("CVV 3 veya 4 haneli rakam olmalıdır.");
      return;
    }

    if (nameOnCard.trim().length < 3) {
      setError("Lütfen kart üzerindeki ismi tam girin.");
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          trackIds: cartIds,
          giftTargetUsername: isGifting ? giftUsername.trim() : undefined
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ödeme sırasında bir hata oluştu.");
        setCheckingOut(false);
        return;
      }

      clearCart();
      router.push("/library");
    } catch {
      setError("Bağlantı hatası.");
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center text-zinc-500">
        Yükleniyor...
      </div>
    );
  }

  if (cartIds.length === 0 || tracks.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
          <ShoppingBag className="h-10 w-10 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sepetiniz boş
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Beğendiğiniz şarkıları sepete ekleyerek buradan topluca satın alabilirsiniz.
        </p>
        <div className="mt-8">
          <Link
            href="/market"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            Marketi Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Sepetim ({tracks.length} ürün)
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="divide-y divide-zinc-200/60 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/40">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-4 p-4 sm:p-6">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-white/5">
                  {track.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                    {track.name}
                  </h3>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {track.artist.name}
                  </p>
                  {track.isOwned && (
                    <span className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      Zaten sahipsiniz
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatTRYFromCents(track.effectivePriceCents)}
                  </div>
                  <button
                    onClick={() => removeFromCart(track.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Kaldır
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Ödeme Bilgileri
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kart Üzerindeki İsim</label>
                <input
                  type="text"
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  placeholder="AD SOYAD"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kart Numarası</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
                    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                    setCardNumber(formatted);
                  }}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">SKT</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
                      if (val.length >= 3) {
                        val = val.substring(0, 2) + "/" + val.substring(2);
                      }
                      setExpiry(val);
                    }}
                    placeholder="AA/YY"
                    maxLength={5}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Sipariş Özeti
            </h2>
            <div className="mt-6 flex items-center justify-between border-b border-zinc-200/60 pb-4 dark:border-white/10">
              <span className="text-zinc-600 dark:text-zinc-400">Ara Toplam</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatTRYFromCents(totalCents)}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Genel Toplam</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {formatTRYFromCents(totalCents)}
              </span>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {hasOwnedTracks && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Sepette zaten sahip olduğunuz şarkılar var. Bu sepeti kendinize alamazsınız, sadece <strong>hediye edebilirsiniz</strong>.
                </div>
              )}

              {!hasOwnedTracks && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/60 p-3 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5">
                  <input 
                    type="checkbox" 
                    checked={isGifting}
                    onChange={(e) => setIsGifting(e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    <Gift className="h-4 w-4 text-indigo-600" />
                    Bunu birine hediye et
                  </span>
                </label>
              )}

              {isGifting && (
                <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                  <label htmlFor="giftUsername" className="block text-xs font-medium text-indigo-900 dark:text-indigo-200">
                    Hediye edilecek kullanıcı adı
                  </label>
                  <input
                    id="giftUsername"
                    type="text"
                    value={giftUsername}
                    onChange={(e) => setGiftUsername(e.target.value)}
                    placeholder="kullanıcı_adı"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkingOut || tracks.length === 0 || (isGifting && !giftUsername.trim())}
                className="flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingOut ? "İşleniyor..." : isGifting ? "Hediye Et" : "Lisansları Satın Al"}
              </button>
            </div>
            
            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Ödeme işleminden sonra lisanslar anında tanımlanacaktır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
