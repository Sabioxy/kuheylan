"use client";

import { useMemo, useState } from "react";

type ArtistOption = { id: string; name: string; bio?: string | null; profileImageUrl?: string | null };
type AlbumOption = { id: string; name: string; artistId: string; coverUrl: string | null; releaseAt: string | null };
type TrackOption = {
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
  isSponsored: boolean;
};

type Props = {
  artists: ArtistOption[];
  albums: AlbumOption[];
  tracks: TrackOption[];
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

export function AdminStudio({ artists, albums, tracks }: Props) {
  const [artistList, setArtistList] = useState<ArtistOption[]>(artists);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");

  const [albumList, setAlbumList] = useState<AlbumOption[]>(albums);
  const [trackList, setTrackList] = useState<TrackOption[]>(tracks);

  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");
  const [newArtistProfileImageUrl, setNewArtistProfileImageUrl] = useState("");
  const [newArtistEmail, setNewArtistEmail] = useState("");
  const [newArtistUsername, setNewArtistUsername] = useState("");
  const [newArtistPassword, setNewArtistPassword] = useState("");

  const [editArtistId, setEditArtistId] = useState("");
  const [editArtistName, setEditArtistName] = useState("");
  const [editArtistBio, setEditArtistBio] = useState("");
  const [editArtistProfileImageUrl, setEditArtistProfileImageUrl] = useState("");

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
  const [editTrackIsSponsored, setEditTrackIsSponsored] = useState(false);

  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const hasArtists = artistList.length > 0;

  const artistOptions = useMemo(() => artistList, [artistList]);
  const albumOptions = useMemo(
    () => albumList.filter((a) => a.artistId === artistId),
    [albumList, artistId],
  );

  const trackOptions = useMemo(
    () => trackList.filter((t) => t.artistId === artistId),
    [trackList, artistId],
  );

  const hasAlbums = albumOptions.length > 0;

  async function createArtist() {
    setResult("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/studio/artist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newArtistName,
          bio: newArtistBio || undefined,
          profileImageUrl: newArtistProfileImageUrl || undefined,
          email: newArtistEmail,
          username: newArtistUsername,
          password: newArtistPassword,
        }),
      });

      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`Sanatçı hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
        return;
      }

      const created = (json as { artist?: ArtistOption }).artist;
      if (created) {
        setArtistList((prev) => [...prev, created]);
        setArtistId(created.id); // select the newly created artist
        setNewArtistName("");
        setNewArtistBio("");
        setNewArtistProfileImageUrl("");
        setNewArtistEmail("");
        setNewArtistUsername("");
        setNewArtistPassword("");
        setResult("Sanatçı ve giriş hesabı oluşturuldu!");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function onPickEditArtist(id: string) {
    setEditArtistId(id);
    const a = artistList.find(x => x.id === id);
    if (!a) {
      setEditArtistName("");
      setEditArtistBio("");
      setEditArtistProfileImageUrl("");
      return;
    }
    setEditArtistName(a.name);
    setEditArtistBio(a.bio ?? "");
    setEditArtistProfileImageUrl(a.profileImageUrl ?? "");
  }

  async function saveArtistEdits() {
    setResult("");
    if (!editArtistId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/studio/artist/${editArtistId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: editArtistName,
          bio: editArtistBio,
          profileImageUrl: editArtistProfileImageUrl,
        }),
      });

      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`Sanatçı güncelleme hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
        return;
      }

      const updated = (json as { artist?: ArtistOption }).artist;
      if (updated) {
        setArtistList((prev) => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      }
      setResult("Sanatçı güncellendi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createAlbum() {
    setResult("");
    setIsLoading(true);
    try {
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
    } finally {
      setIsLoading(false);
    }
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
    const a = albumOptions.find((x) => x.id === nextId);
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
    setIsLoading(true);
    try {
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

      const updated = (json as { album?: AlbumOption }).album;
      if (updated && typeof updated === "object" && typeof updated.id === "string") {
        setAlbumList((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      }
      setResult("Albüm güncellendi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteAlbum() {
    if (!editAlbumId) return;
    if (!confirm("Bu albümü ve içindeki tüm şarkıları silmek istediğinize emin misiniz? (Satın alınan şarkılar varsa silinemez)")) return;

    setResult("");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/studio/album/${editAlbumId}`, { method: "DELETE" });
      const json: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResult(`Albüm silme hata: ${getErrorMessage(json) ?? "Bilinmeyen"}`);
        return;
      }

      setAlbumList((prev) => prev.filter((x) => x.id !== editAlbumId));
      setTrackList((prev) => prev.filter((x) => x.albumId !== editAlbumId));
      setEditAlbumId("");
      setEditAlbumName("");
      setEditAlbumCoverUrl("");
      setResult("Albüm ve şarkıları silindi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createTrack() {
    setResult("");
    setIsLoading(true);
    try {
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
    } finally {
      setIsLoading(false);
    }
  }

  function onPickEditTrack(nextId: string) {
    setEditTrackId(nextId);
    const t = trackOptions.find((x) => x.id === nextId);
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
    setEditTrackIsAvailable(t.isAvailable);
    setEditTrackIsSponsored(t.isSponsored || false);
  }

  async function saveTrackEdits() {
    setResult("");
    if (!editTrackId.trim()) return;
    setIsLoading(true);
    try {
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
          isSponsored: editTrackIsSponsored,
        }),
      });

      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`Track güncelleme hata (${res.status}): ${getErrorMessage(json) ?? "Bilinmeyen"}`);
        return;
      }

      const updated = (json as { track?: TrackOption }).track;
      if (updated && typeof updated === "object" && typeof updated.id === "string") {
        setTrackList((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      }
      setResult("Şarkı güncellendi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTrack() {
    if (!editTrackId) return;
    if (!confirm("Bu şarkıyı kalıcı olarak silmek istediğinize emin misiniz? (Satın alan kullanıcılar varsa silinemez)")) return;

    setResult("");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/studio/track/${editTrackId}`, { method: "DELETE" });
      const json: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResult(`Şarkı silme hata: ${getErrorMessage(json) ?? "Bilinmeyen"}`);
        return;
      }

      setTrackList((prev) => prev.filter((x) => x.id !== editTrackId));
      setEditTrackId("");
      setEditTrackName("");
      setEditTrackCoverImageUrl("");
      setResult("Şarkı silindi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Sanatçı Ekle</h2>
        <div className="mt-4 grid gap-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {newArtistProfileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newArtistProfileImageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="artist-name" className={labelClass}>Sanatçı Adı</label>
                <input
                  id="artist-name"
                  className={inputClass}
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="artist-profile" className={labelClass}>Profil Fotoğrafı (URL) (opsiyonel)</label>
                <input
                  id="artist-profile"
                  className={inputClass}
                  value={newArtistProfileImageUrl}
                  onChange={(e) => setNewArtistProfileImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="artist-bio" className={labelClass}>Biyografi (opsiyonel)</label>
            <textarea
              id="artist-bio"
              className={inputClass + " h-20 py-2 resize-none"}
              value={newArtistBio}
              onChange={(e) => setNewArtistBio(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="artist-email" className={labelClass}>E-posta (Giriş İçin)</label>
              <input
                id="artist-email"
                className={inputClass}
                value={newArtistEmail}
                onChange={(e) => setNewArtistEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
            <div>
              <label htmlFor="artist-username" className={labelClass}>Kullanıcı Adı</label>
              <input
                id="artist-username"
                className={inputClass}
                value={newArtistUsername}
                onChange={(e) => setNewArtistUsername(e.target.value)}
                placeholder="sanatci_adi"
              />
            </div>
          </div>
          <div>
            <label htmlFor="artist-pass" className={labelClass}>Şifre</label>
            <input
              id="artist-pass"
              type="password"
              className={inputClass}
              value={newArtistPassword}
              onChange={(e) => setNewArtistPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className={buttonClass} onClick={createArtist} disabled={isLoading || !newArtistName.trim() || !newArtistEmail.trim() || !newArtistPassword.trim()}>
            Sanatçı ve Hesap Oluştur
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Sanatçı Düzenle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mevcut bir sanatçının profil bilgilerini güncelleyin.</p>
        <div className="mt-4 grid gap-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {editArtistProfileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editArtistProfileImageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="edit-artist-select" className={labelClass}>Sanatçı Seç</label>
                <select
                  id="edit-artist-select"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editArtistId}
                  onChange={(e) => onPickEditArtist(e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {artistList.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-artist-name" className={labelClass}>Sanatçı Adı</label>
                <input
                  id="edit-artist-name"
                  className={inputClass}
                  value={editArtistName}
                  onChange={(e) => setEditArtistName(e.target.value)}
                  disabled={!editArtistId}
                />
              </div>
              <div>
                <label htmlFor="edit-artist-profile" className={labelClass}>Sanatçı Profil Fotoğrafı (URL)</label>
                <input
                  id="edit-artist-profile"
                  className={inputClass}
                  value={editArtistProfileImageUrl}
                  onChange={(e) => setEditArtistProfileImageUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!editArtistId}
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="edit-artist-bio" className={labelClass}>Biyografi (opsiyonel)</label>
            <textarea
              id="edit-artist-bio"
              className={inputClass + " h-20 py-2 resize-none"}
              value={editArtistBio}
              onChange={(e) => setEditArtistBio(e.target.value)}
              disabled={!editArtistId}
            />
          </div>
          <button className={buttonClass} onClick={saveArtistEdits} disabled={isLoading || !editArtistId || !editArtistName.trim()}>
            Sanatçıyı Güncelle
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Sanatçı Seç</h2>
        <div className="mt-4">
          <div className={labelClass}>Artist</div>
          <select
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={artistId}
            onChange={(e) => {
              setArtistId(e.target.value);
              setTrackAlbumId("");
              setEditAlbumId("");
              setEditTrackId("");
            }}
            disabled={!hasArtists}
          >
            {artistOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {!hasArtists ? (
            <p className="mt-2 text-sm text-muted-foreground">Önce sanatçı eklenmeli.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Albüm Ekle</h2>

        <div className="mt-4 grid gap-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {albumCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={albumCoverUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="album-name" className={labelClass}>Albüm Adı</label>
                <input id="album-name" className={inputClass} value={albumName} onChange={e => setAlbumName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="album-cover" className={labelClass}>Kapak Fotoğrafı (URL) (opsiyonel)</label>
                <input id="album-cover" className={inputClass} value={albumCoverUrl} onChange={e => setAlbumCoverUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
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

          <button className={buttonClass} onClick={createAlbum} disabled={isLoading || !hasArtists || !albumName.trim()}>
            Albüm Oluştur
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Albüm Düzenle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Var olan bir albümü seçip düzenleyebilirsin.</p>
        <div className="mt-4 grid gap-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {editAlbumCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editAlbumCoverUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="edit-album" className={labelClass}>Albüm Seç</label>
                <select
                  id="edit-album"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editAlbumId}
                  onChange={(e) => onPickEditAlbum(e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {albumOptions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-album-name" className={labelClass}>Albüm Adı</label>
                <input id="edit-album-name" className={inputClass} value={editAlbumName} onChange={e => setEditAlbumName(e.target.value)} disabled={!editAlbumId} />
              </div>
              <div>
                <label htmlFor="edit-album-cover" className={labelClass}>Kapak Fotoğrafı (URL)</label>
                <input id="edit-album-cover" className={inputClass} value={editAlbumCoverUrl} onChange={e => setEditAlbumCoverUrl(e.target.value)} placeholder="/images/... veya https://..." disabled={!editAlbumId} />
              </div>
            </div>
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

          <div className="flex gap-3">
            <button
              className={buttonClass + " flex-1"}
              onClick={saveAlbumEdits}
              disabled={isLoading || !hasArtists || !editAlbumId.trim() || !editAlbumName.trim()}
            >
              Albümü Kaydet
            </button>
            <button
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              onClick={deleteAlbum}
              disabled={isLoading || !editAlbumId}
            >
              Albümü Sil
            </button>
          </div>
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
              disabled={!hasArtists || !hasAlbums}
            >
              <option value="">Albüm seç</option>
              {albumOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {!hasAlbums ? (
              <p className="mt-2 text-sm text-muted-foreground">Önce bir albüm oluştur.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {trackCoverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trackCoverImageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="track-name" className={labelClass}>Şarkı Adı</label>
                <input id="track-name" className={inputClass} value={trackName} onChange={e => setTrackName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="track-cover" className={labelClass}>Kapak Fotoğrafı (URL) (opsiyonel)</label>
                <input id="track-cover" className={inputClass} value={trackCoverImageUrl} onChange={e => setTrackCoverImageUrl(e.target.value)} placeholder="/images/... veya https://..." />
              </div>
            </div>
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
            disabled={isLoading || !hasArtists || !trackAlbumId.trim() || !trackName.trim() || !trackCdnAudioUrl.trim()}
          >
            Şarkı Oluştur
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Şarkı Düzenle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Var olan bir şarkıyı seçip düzenleyebilirsin.</p>

        <div className="mt-4 grid gap-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
              {editTrackCoverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editTrackCoverImageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-white/5">Yok</div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="edit-track" className={labelClass}>Şarkı Seç</label>
                <select
                  id="edit-track"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editTrackId}
                  onChange={(e) => onPickEditTrack(e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {trackOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-track-name" className={labelClass}>Şarkı Adı</label>
                <input id="edit-track-name" className={inputClass} value={editTrackName} onChange={e => setEditTrackName(e.target.value)} disabled={!editTrackId} />
              </div>
              <div>
                <label htmlFor="edit-track-cover" className={labelClass}>Kapak Fotoğrafı (URL)</label>
                <input id="edit-track-cover" className={inputClass} value={editTrackCoverImageUrl} onChange={e => setEditTrackCoverImageUrl(e.target.value)} disabled={!editTrackId} />
              </div>
            </div>
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
              {albumOptions.map((a) => (
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

          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
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

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/5">
              <label htmlFor="edit-track-sponsored" className={labelClass}>
                Sponsorlu olarak işaretle (Admin)
              </label>
              <input
                id="edit-track-sponsored"
                type="checkbox"
                className="h-4 w-4 accent-indigo-600 dark:accent-indigo-400"
                checked={editTrackIsSponsored}
                onChange={(e) => setEditTrackIsSponsored(e.target.checked)}
                disabled={!editTrackId}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className={buttonClass + " flex-1"}
              onClick={saveTrackEdits}
              disabled={isLoading || !hasArtists || !editTrackId.trim() || !editTrackAlbumId.trim() || !editTrackName.trim() || !editTrackCdnAudioUrl.trim()}
            >
              Şarkıyı Kaydet
            </button>
            <button
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              onClick={deleteTrack}
              disabled={isLoading || !editTrackId}
            >
              Şarkıyı Sil
            </button>
          </div>
        </div>
      </div>

      {result ? <div className="rounded-md border bg-muted px-3 py-2 text-sm">{result}</div> : null}
    </div>
  );
}
