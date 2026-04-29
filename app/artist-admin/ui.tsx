"use client";

import { useState } from "react";

type Props = {
  artistId: string;
  albums: { id: string; name: string; coverUrl: string | null; releaseAt: string | null }[];
  tracks: {
    id: string;
    name: string;
    artistId: string;
    albumId: string;
    cdnAudioUrl: string;
    previewAudioUrl: string | null;
    coverImageUrl: string | null;
    genre: string | null;
    bpm: number | null;
    basePriceCents: number;
    effectivePriceCents: number;
    isAvailable: boolean;
  }[];
  stats?: {
    balanceCents: number;
    totalSalesCount: number;
    recentSales: {
      id: string;
      trackName: string;
      buyerUsername: string;
      effectivePriceCents: number;
      commissionCents: number;
      artistPayoutCents: number;
      createdAt: string;
    }[];
  };
};

type ApiError = { error?: unknown };

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const err = (payload as ApiError).error;
  return typeof err === "string" ? err : undefined;
}

const labelClass = "text-sm font-medium text-zinc-900 dark:text-zinc-50";
const inputClass =
  "mt-2 h-10 w-full rounded-md border border-zinc-200/60 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none " +
  "focus:ring-2 focus:ring-zinc-950/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50";
const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 " +
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100";

export function ArtistStudio({ artistId, albums, tracks, stats }: Props) {
  const [albumList, setAlbumList] = useState(albums);
  const [trackList, setTrackList] = useState(tracks);

  const [albumName, setAlbumName] = useState("");
  const [albumCoverUrl, setAlbumCoverUrl] = useState("");
  const [albumReleaseAt, setAlbumReleaseAt] = useState("");

  const [editAlbumId, setEditAlbumId] = useState("");
  const [editAlbumName, setEditAlbumName] = useState("");
  const [editAlbumCoverUrl, setEditAlbumCoverUrl] = useState("");
  const [editAlbumReleaseAt, setEditAlbumReleaseAt] = useState("");

  const [trackName, setTrackName] = useState("");
  const [trackAlbumId, setTrackAlbumId] = useState("");
  const [trackCdnAudioUrl, setTrackCdnAudioUrl] = useState("");
  const [trackPreviewAudioUrl, setTrackPreviewAudioUrl] = useState("");
  const [trackCoverImageUrl, setTrackCoverImageUrl] = useState("");
  const [trackGenre, setTrackGenre] = useState("");
  const [trackBpm, setTrackBpm] = useState("");
  const [trackBasePriceCents, setTrackBasePriceCents] = useState("199");
  const [trackEffectivePriceCents, setTrackEffectivePriceCents] = useState("199");
  const [trackIsAvailable, setTrackIsAvailable] = useState(true);

  const [editTrackId, setEditTrackId] = useState("");
  const [editTrackAlbumId, setEditTrackAlbumId] = useState("");
  const [editTrackName, setEditTrackName] = useState("");
  const [editTrackCdnAudioUrl, setEditTrackCdnAudioUrl] = useState("");
  const [editTrackPreviewAudioUrl, setEditTrackPreviewAudioUrl] = useState("");
  const [editTrackCoverImageUrl, setEditTrackCoverImageUrl] = useState("");
  const [editTrackGenre, setEditTrackGenre] = useState("");
  const [editTrackBpm, setEditTrackBpm] = useState("");
  const [editTrackBasePriceCents, setEditTrackBasePriceCents] = useState("");
  const [editTrackEffectivePriceCents, setEditTrackEffectivePriceCents] = useState("");
  const [editTrackIsAvailable, setEditTrackIsAvailable] = useState(true);

  const [result, setResult] = useState<string>("");

  const hasAlbums = albumList.length > 0;

  async function createAlbum() {
    setResult("");

    const res = await fetch("/api/studio/album", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        artistId,
        name: albumName,
        coverUrl: albumCoverUrl || undefined,
        releaseAt: albumReleaseAt || undefined,
      }),
    });

    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult(`Album hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
      return;
    }

    setResult("Albüm oluşturuldu. Listeye düşmesi için sayfayı yenile.");
  }

  function isoToYmd(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function onPickEditAlbum(nextId: string) {
    setEditAlbumId(nextId);
    const a = albumList.find((x) => x.id === nextId);
    if (!a) {
      setEditAlbumName("");
      setEditAlbumCoverUrl("");
      setEditAlbumReleaseAt("");
      return;
    }
    setEditAlbumName(a.name);
    setEditAlbumCoverUrl(a.coverUrl ?? "");
    setEditAlbumReleaseAt(isoToYmd(a.releaseAt));
  }

  async function saveAlbumEdits() {
    setResult("");
    if (!editAlbumId.trim()) return;

    const res = await fetch(`/api/studio/album/${editAlbumId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: editAlbumName,
        coverUrl: editAlbumCoverUrl,
        releaseAt: editAlbumReleaseAt,
      }),
    });

    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult(`Album güncelleme hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
      return;
    }

    const updated = (json as { album?: (typeof albumList)[number] }).album;
    if (updated && typeof updated === "object" && typeof updated.id === "string") {
      setAlbumList((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    }
    setResult("Albüm güncellendi.");
  }

  async function createTrack() {
    setResult("");

    const res = await fetch("/api/studio/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        artistId,
        albumId: trackAlbumId,
        name: trackName,
        cdnAudioUrl: trackCdnAudioUrl,
        previewAudioUrl: trackPreviewAudioUrl || undefined,
        coverImageUrl: trackCoverImageUrl || undefined,
        genre: trackGenre || undefined,
        bpm: trackBpm || undefined,
        basePriceCents: trackBasePriceCents,
        effectivePriceCents: trackEffectivePriceCents,
        isAvailable: trackIsAvailable,
      }),
    });

    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult(`Track hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
      return;
    }

    setResult("Şarkı oluşturuldu.");
  }

  function onPickEditTrack(nextId: string) {
    setEditTrackId(nextId);
    const t = trackList.find((x) => x.id === nextId);
    if (!t) {
      setEditTrackAlbumId("");
      setEditTrackName("");
      setEditTrackCdnAudioUrl("");
      setEditTrackPreviewAudioUrl("");
      setEditTrackCoverImageUrl("");
      setEditTrackGenre("");
      setEditTrackBpm("");
      setEditTrackBasePriceCents("");
      setEditTrackEffectivePriceCents("");
      setEditTrackIsAvailable(true);
      return;
    }

    setEditTrackAlbumId(t.albumId);
    setEditTrackName(t.name);
    setEditTrackCdnAudioUrl(t.cdnAudioUrl);
    setEditTrackPreviewAudioUrl(t.previewAudioUrl ?? "");
    setEditTrackCoverImageUrl(t.coverImageUrl ?? "");
    setEditTrackGenre(t.genre ?? "");
    setEditTrackBpm(t.bpm === null ? "" : String(t.bpm));
    setEditTrackBasePriceCents(String(t.basePriceCents));
    setEditTrackEffectivePriceCents(String(t.effectivePriceCents));
    setEditTrackIsAvailable(Boolean(t.isAvailable));
  }

  async function saveTrackEdits() {
    setResult("");
    if (!editTrackId.trim()) return;

    const res = await fetch(`/api/studio/track/${editTrackId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        albumId: editTrackAlbumId,
        name: editTrackName,
        cdnAudioUrl: editTrackCdnAudioUrl,
        previewAudioUrl: editTrackPreviewAudioUrl,
        coverImageUrl: editTrackCoverImageUrl,
        genre: editTrackGenre,
        bpm: editTrackBpm,
        basePriceCents: editTrackBasePriceCents,
        effectivePriceCents: editTrackEffectivePriceCents,
        isAvailable: editTrackIsAvailable,
      }),
    });

    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult(`Track güncelleme hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
      return;
    }

    const updated = (json as { track?: (typeof trackList)[number] }).track;
    if (updated && typeof updated === "object" && typeof updated.id === "string") {
      setTrackList((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    }
    setResult("Şarkı güncellendi.");
  }

  return (
    <div className="space-y-10">
      {stats && (
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">İstatistikler ve Kazançlar</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Toplam Bakiye</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.balanceCents / 100)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Toplam Satış</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.totalSalesCount}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-4">Son Satışlar</h3>
            {stats.recentSales.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200/60 dark:border-white/10">
                <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-white/10">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Şarkı</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Alıcı</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Kazanç</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 bg-white dark:divide-white/10 dark:bg-zinc-950">
                    {stats.recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">{sale.trackName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">@{sale.buyerUsername}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          +{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(sale.artistPayoutCents / 100)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                          {new Date(sale.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz satış yapılmamış.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Albüm Ekle</h2>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="album-name" className={labelClass}>
              Albüm Adı
            </label>
            <input
              id="album-name"
              className={inputClass}
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="album-cover" className={labelClass}>
              Cover URL (opsiyonel)
            </label>
            <input
              id="album-cover"
              className={inputClass}
              value={albumCoverUrl}
              onChange={(e) => setAlbumCoverUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="album-release" className={labelClass}>
              Release At (opsiyonel)
            </label>
            <input
              id="album-release"
              className={inputClass}
              value={albumReleaseAt}
              onChange={(e) => setAlbumReleaseAt(e.target.value)}
              placeholder="2026-04-17"
            />
          </div>

          <button className={buttonClass} onClick={createAlbum} disabled={!albumName.trim()}>
            Albüm Oluştur
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Albüm Düzenle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Var olan bir albümü seçip düzenleyebilirsin.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="edit-album" className={labelClass}>
              Albüm
            </label>
            <select
              id="edit-album"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={editAlbumId}
              onChange={(e) => onPickEditAlbum(e.target.value)}
              disabled={!hasAlbums}
            >
              <option value="">Albüm seç</option>
              {albumList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-album-name" className={labelClass}>
              Albüm Adı
            </label>
            <input
              id="edit-album-name"
              className={inputClass}
              value={editAlbumName}
              onChange={(e) => setEditAlbumName(e.target.value)}
              disabled={!editAlbumId}
            />
          </div>

          <div>
            <label htmlFor="edit-album-cover" className={labelClass}>
              Cover URL (opsiyonel)
            </label>
            <input
              id="edit-album-cover"
              className={inputClass}
              value={editAlbumCoverUrl}
              onChange={(e) => setEditAlbumCoverUrl(e.target.value)}
              placeholder="/images/... veya https://..."
              disabled={!editAlbumId}
            />
          </div>

          <div>
            <label htmlFor="edit-album-release" className={labelClass}>
              Release At (opsiyonel)
            </label>
            <input
              id="edit-album-release"
              className={inputClass}
              value={editAlbumReleaseAt}
              onChange={(e) => setEditAlbumReleaseAt(e.target.value)}
              placeholder="2026-04-17"
              disabled={!editAlbumId}
            />
          </div>

          <button className={buttonClass} onClick={saveAlbumEdits} disabled={!editAlbumId.trim() || !editAlbumName.trim()}>
            Albümü Kaydet
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Şarkı Ekle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Albüm seçip şarkını ekle.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="track-album" className={labelClass}>
              Albüm
            </label>
            <select
              id="track-album"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={trackAlbumId}
              onChange={(e) => setTrackAlbumId(e.target.value)}
              disabled={!hasAlbums}
            >
              <option value="">Albüm seç</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {!hasAlbums ? (
              <p className="mt-2 text-sm text-muted-foreground">Önce bir albüm oluştur.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="track-name" className={labelClass}>
              Şarkı Adı
            </label>
            <input
              id="track-name"
              className={inputClass}
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="track-cdn" className={labelClass}>
              Full Şarkı URL
            </label>
            <input
              id="track-cdn"
              className={inputClass}
              value={trackCdnAudioUrl}
              onChange={(e) => setTrackCdnAudioUrl(e.target.value)}
              placeholder="/audio/... veya https://..."
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Not: YouTube linki olmaz. Direkt bir ses dosyası URL’si (mp3/wav) veya public klasöründen
              <span className="font-mono"> /audio/...</span> yolu gir.
            </p>
          </div>

          <div>
            <label htmlFor="track-preview" className={labelClass}>
              Preview URL (opsiyonel)
            </label>
            <input
              id="track-preview"
              className={inputClass}
              value={trackPreviewAudioUrl}
              onChange={(e) => setTrackPreviewAudioUrl(e.target.value)}
              placeholder="/audio/... veya https://..."
            />
          </div>

          <div>
            <label htmlFor="track-cover" className={labelClass}>
              Kapak Fotoğraf URL (opsiyonel)
            </label>
            <input
              id="track-cover"
              className={inputClass}
              value={trackCoverImageUrl}
              onChange={(e) => setTrackCoverImageUrl(e.target.value)}
              placeholder="/images/... veya https://..."
            />
          </div>

          <div>
            <label htmlFor="track-genre" className={labelClass}>
              Genre (opsiyonel)
            </label>
            <input
              id="track-genre"
              className={inputClass}
              value={trackGenre}
              onChange={(e) => setTrackGenre(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="track-bpm" className={labelClass}>
              BPM (opsiyonel)
            </label>
            <input
              id="track-bpm"
              className={inputClass}
              value={trackBpm}
              onChange={(e) => setTrackBpm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="track-base" className={labelClass}>
                Base Price (cents)
              </label>
              <input
                id="track-base"
                className={inputClass}
                value={trackBasePriceCents}
                onChange={(e) => setTrackBasePriceCents(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="track-effective" className={labelClass}>
                Effective Price (cents)
              </label>
              <input
                id="track-effective"
                className={inputClass}
                value={trackEffectivePriceCents}
                onChange={(e) => setTrackEffectivePriceCents(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <label htmlFor="track-available" className={labelClass}>
              Market’te satılsın mı?
            </label>
            <input
              id="track-available"
              type="checkbox"
              className="h-4 w-4 accent-zinc-950 dark:accent-white"
              checked={trackIsAvailable}
              onChange={(e) => setTrackIsAvailable(e.target.checked)}
            />
          </div>

          <button
            className={buttonClass}
            onClick={createTrack}
            disabled={!trackAlbumId.trim() || !trackName.trim() || !trackCdnAudioUrl.trim()}
          >
            Şarkı Oluştur
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Şarkı Düzenle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Var olan bir şarkıyı seçip düzenleyebilirsin.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="edit-track" className={labelClass}>
              Şarkı
            </label>
            <select
              id="edit-track"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={editTrackId}
              onChange={(e) => onPickEditTrack(e.target.value)}
              disabled={trackList.length === 0}
            >
              <option value="">Şarkı seç</option>
              {trackList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-track-album" className={labelClass}>
              Albüm
            </label>
            <select
              id="edit-track-album"
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={editTrackAlbumId}
              onChange={(e) => setEditTrackAlbumId(e.target.value)}
              disabled={!editTrackId || !hasAlbums}
            >
              <option value="">Albüm seç</option>
              {albumList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-track-name" className={labelClass}>
              Şarkı Adı
            </label>
            <input
              id="edit-track-name"
              className={inputClass}
              value={editTrackName}
              onChange={(e) => setEditTrackName(e.target.value)}
              disabled={!editTrackId}
            />
          </div>

          <div>
            <label htmlFor="edit-track-cdn" className={labelClass}>
              Full Şarkı URL
            </label>
            <input
              id="edit-track-cdn"
              className={inputClass}
              value={editTrackCdnAudioUrl}
              onChange={(e) => setEditTrackCdnAudioUrl(e.target.value)}
              placeholder="/audio/... veya https://..."
              disabled={!editTrackId}
            />
          </div>

          <div>
            <label htmlFor="edit-track-preview" className={labelClass}>
              Preview URL (opsiyonel)
            </label>
            <input
              id="edit-track-preview"
              className={inputClass}
              value={editTrackPreviewAudioUrl}
              onChange={(e) => setEditTrackPreviewAudioUrl(e.target.value)}
              placeholder="/audio/... veya https://..."
              disabled={!editTrackId}
            />
          </div>

          <div>
            <label htmlFor="edit-track-cover" className={labelClass}>
              Kapak Fotoğraf URL (opsiyonel)
            </label>
            <input
              id="edit-track-cover"
              className={inputClass}
              value={editTrackCoverImageUrl}
              onChange={(e) => setEditTrackCoverImageUrl(e.target.value)}
              placeholder="/images/... veya https://..."
              disabled={!editTrackId}
            />
          </div>

          <div>
            <label htmlFor="edit-track-genre" className={labelClass}>
              Genre (opsiyonel)
            </label>
            <input
              id="edit-track-genre"
              className={inputClass}
              value={editTrackGenre}
              onChange={(e) => setEditTrackGenre(e.target.value)}
              disabled={!editTrackId}
            />
          </div>

          <div>
            <label htmlFor="edit-track-bpm" className={labelClass}>
              BPM (opsiyonel)
            </label>
            <input
              id="edit-track-bpm"
              className={inputClass}
              value={editTrackBpm}
              onChange={(e) => setEditTrackBpm(e.target.value)}
              disabled={!editTrackId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-track-base" className={labelClass}>
                Base Price (cents)
              </label>
              <input
                id="edit-track-base"
                className={inputClass}
                value={editTrackBasePriceCents}
                onChange={(e) => setEditTrackBasePriceCents(e.target.value)}
                disabled={!editTrackId}
              />
            </div>
            <div>
              <label htmlFor="edit-track-effective" className={labelClass}>
                Effective Price (cents)
              </label>
              <input
                id="edit-track-effective"
                className={inputClass}
                value={editTrackEffectivePriceCents}
                onChange={(e) => setEditTrackEffectivePriceCents(e.target.value)}
                disabled={!editTrackId}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <label htmlFor="edit-track-available" className={labelClass}>
              Market’te satılsın mı?
            </label>
            <input
              id="edit-track-available"
              type="checkbox"
              className="h-4 w-4 accent-zinc-950 dark:accent-white"
              checked={editTrackIsAvailable}
              onChange={(e) => setEditTrackIsAvailable(e.target.checked)}
              disabled={!editTrackId}
            />
          </div>

          <button
            className={buttonClass}
            onClick={saveTrackEdits}
            disabled={!editTrackId.trim() || !editTrackAlbumId.trim() || !editTrackName.trim() || !editTrackCdnAudioUrl.trim()}
          >
            Şarkıyı Kaydet
          </button>
        </div>
      </div>

      {result ? <div className="rounded-md border bg-muted px-3 py-2 text-sm">{result}</div> : null}
    </div>
  );
}
