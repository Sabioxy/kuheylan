# Küheylan - Dijital Müzik Lisans Pazaryeri

Küheylan, sanatçıların müzik lisanslarını doğrudan dinleyicilere sattığı, abonelik tabanlı olmayan, "satın al ve ömür boyu sahip ol" modelini benimseyen modern bir B2C pazaryeri platformudur.

## 🚀 Öne Çıkan Özellikler

- **Müzik Lisanslama Modeli:** Abonelik yerine tek seferlik satın alma ile ömür boyu kullanım hakkı.
- **Dinamik Ses Oynatıcı:** 
    - Sahip olunan şarkılar arasında ileri/geri geçiş desteği.
    - Şarkı bittiğinde otomatik sonraki parçaya geçiş.
    - Misafirler için önizleme, sahipler için tam sürüm oynatma.
- **Hediye Sistemi:** Şarkıları diğer kullanıcılara kullanıcı adları üzerinden hediye edebilme.
- **Bildirim Merkezi:** Hediye alındığında veya önemli güncellemelerde kullanıcıya anlık bildirim (badge desteği ile).
- **Gelişmiş Filtreleme:** Tür, BPM ve fiyat bazlı arama ve filtreleme seçenekleri.
- **Panel Yönetimi:**
    - **Admin Paneli:** Platform geneli istatistikler ve içerik yönetimi.
    - **Sanatçı Paneli:** Şarkı yükleme, düzenleme ve bakiye takibi.
- **Modern UI/UX:** Dark mode desteği, premium cam (glassmorphism) efektleri ve akıcı animasyonlar (`framer-motion`).

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js (App Router)
- **Veritabanı:** Prisma (SQLite)
- **Styling:** Tailwind CSS + Vanilla CSS
- **Animasyon:** Framer Motion
- **İkonlar:** Lucide React
- **Tarih İşlemleri:** date-fns

## ⚙️ Kurulum ve Başlatma

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

2.  **Veritabanı Yapılandırması:**
    `.env` dosyasında veritabanı yolunu belirtin:
    ```bash
    DATABASE_URL="file:./dev.db"
    ```

3.  **Veritabanını Hazırlayın:**
    ```bash
    npx prisma db push
    npx prisma generate
    ```

4.  **Demo Verileri Yükleyin (Opsiyonel):**
    ```bash
    npm run db:seed
    ```

5.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```

Platforma `http://localhost:3000` üzerinden erişebilirsiniz.

## 📁 Proje Yapısı

- `/app`: Sayfa yönlendirmeleri ve API rotaları.
- `/components`: Yeniden kullanılabilir UI bileşenleri (Player, TopNav, NotificationBell vb.).
- `/lib`: Paylaşılan kütüphaneler (Prisma client, Auth, Cart vb.).
- `/prisma`: Veritabanı şeması ve migration dosyaları.
- `/public`: Statik varlıklar ve görseller.

## ⚠️ Önemli Notlar

- Windows üzerinde `npx prisma generate` çalıştırırken `EPERM` hatası alırsanız, lütfen çalışan `npm run dev` sunucusunu geçici olarak durdurun.
- Bildirimler her 30 saniyede bir otomatik olarak kontrol edilir.
