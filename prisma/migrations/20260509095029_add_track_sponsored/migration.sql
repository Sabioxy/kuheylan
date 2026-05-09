-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cdnAudioUrl" TEXT NOT NULL,
    "previewAudioUrl" TEXT,
    "bpm" INTEGER,
    "genre" TEXT,
    "coverImageUrl" TEXT,
    "basePriceCents" INTEGER NOT NULL,
    "effectivePriceCents" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "albumId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("albumId", "artistId", "basePriceCents", "bpm", "cdnAudioUrl", "coverImageUrl", "createdAt", "effectivePriceCents", "genre", "id", "isAvailable", "name", "previewAudioUrl", "updatedAt") SELECT "albumId", "artistId", "basePriceCents", "bpm", "cdnAudioUrl", "coverImageUrl", "createdAt", "effectivePriceCents", "genre", "id", "isAvailable", "name", "previewAudioUrl", "updatedAt" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");
CREATE INDEX "Track_isAvailable_idx" ON "Track"("isAvailable");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
