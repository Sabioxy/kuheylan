# Küheylan Platformu Kullanım ve Teknik Kılavuzu

Bu belge, Küheylan dijital müzik lisans pazar yerinin teknik yapısını, veri tabanı işleyişini ve içerik yönetim (Admin/Sanatçı) özelliklerini açıklamaktadır.

---

## 1. Teknik Mimari
*   **Framework:** Next.js (App Router)
*   **Veri Tabanı:** SQLite (Prisma ORM ile yönetilir)
*   **Stil:** Tailwind CSS & Framer Motion (Animasyonlar için)
*   **Kimlik Doğrulama:** Custom Session-based Auth (JWT benzeri token yapısı)

---

## 2. Veri Tabanı Mimarisi (Entity Relationship)
Küheylan'ın veri yapısı, ilişkisel bir modelleme üzerine kuruludur. Tüm modeller `prisma/schema.prisma` dosyasında tanımlıdır.

### 2.1 Temel Modeller ve Alanlar
*   **User (Kullanıcı):**
    *   `role`: `USER`, `ARTIST` veya `ADMIN`.
    *   `passwordHash`: Kullanıcının şifresi. (Sistem kolaylık açısından **düz metin** olarak saklamaktadır).
    *   `artistId`: Eğer kullanıcı bir sanatçıysa, `Artist` tablosuna bire-bir (1:1) ilişki ile bağlanır.
*   **Artist (Sanatçı):**
    *   `status`: `STARTER`, `MID` veya `PREMIUM`.
    *   `balanceCents`: Sanatçının kazandığı toplam bakiye (Kuruş/Cent cinsinden tutulur).
    *   `profileImageUrl`: Sanatçının profil fotoğrafı URL'si.
*   **Track (Şarkı):**
    *   `basePriceCents`: Şarkının liste fiyatı.
    *   `effectivePriceCents`: İndirimler uygulandıktan sonraki güncel satış fiyatı.
    *   `cdnAudioUrl`: Satın alanların eriştiği tam kalite dosya.
    *   `previewAudioUrl`: Herkese açık 30-60 saniyelik demo dosyası.
*   **Purchase (Satın Alım):**
    *   Bu tablo **değiştirilemez (immutable)** bir log kaydıdır. Satış anındaki fiyatı ve sanatçı komisyonunu dondurur.
    *   `commissionBps`: Satış anındaki komisyon oranı (Baz puan, örn: 1000 = %10).

### 2.2 İş Kuralları ve İlişkiler
*   **Komisyon Mantığı:** `STARTER` sanatçılardan %7, diğerlerinden %10 komisyon alınır. Bu hesaplama `Purchase` kaydı oluşurken otomatik yapılır.
*   **Sahiplik Zinciri:** Bir şarkı (`Track`), bir albüme (`Album`) ve bir sanatçıya (`Artist`) bağlıdır.
*   **Kütüphane Sistemi:** Kullanıcı bir şarkı satın aldığında, `UserLibrary` tablosunda kalıcı bir kayıt oluşur. Bu kayıt silinmez.

### 2.3 Veri Tabanına Görsel Erişim (Prisma Studio)
Veri tabanını profesyonel bir arayüzle yönetmek için:
1.  Terminalde `npx prisma studio` komutunu çalıştırın.
2.  `localhost:5555` adresinden tablolar arası geçiş yapın.
3.  **İpucu:** Filtreleme (Filter) özelliğini kullanarak belirli bir sanatçının satışlarını veya sadece aktif şarkıları listeleyebilirsiniz.

### 2.4 Admin Yetkisi Verme (Manuel)
Yeni bir Admin atamak için şu adımları izleyin:
1.  `Prisma Studio`'da **User** tablosuna gidin.
2.  Yetki vermek istediğiniz kullanıcıyı bulun.
3.  `role` sütunundaki değeri `USER`'dan `ADMIN`'e değiştirin.
4.  Alttaki **"Save 1 Change"** butonuna basarak kaydedin.

---

## 3. İçerik Ekleme Rehberi (Fotoğraf ve Ses)
Küheylan'da içerikler **URL tabanlı** yönetilir. Dosyalarınızı iki şekilde ekleyebilirsiniz:

### 3.1 Sanatçı Profil Fotoğrafı Ekleme
1.  **Yerel Yöntem:** Fotoğrafınızı projenin `public/images/` klasörüne kopyalayın (örn: `ben.jpg`). Paneldeki URL alanına `/images/ben.jpg` yazın.
2.  **İnternet Yöntemi:** Görselin internetteki direkt linkini (örn: `https://.../img.jpg`) yapıştırın.
*   **İpucu:** Panelde görsel belirdiğinde linkiniz doğru demektir.

### 3.2 Albüm Kapak Fotoğrafı Ekleme
Albüm oluştururken veya düzenlerken bir kapak görseli belirleyebilirsiniz. Bu görsel, sanatçı detay sayfasında albüm listelenirken kullanılır.
*   **İpucu:** Diğer görsellerde olduğu gibi `/images/...` veya tam URL şeklinde ekleyebilirsiniz.

### 3.3 Şarkı ve Önizleme (Demo) Ekleme
Şarkı eklerken iki farklı dosya alanı bulunur:

1.  **Full Şarkı URL:** Şarkının tamamıdır. Sadece satın alan kullanıcılar kütüphanesinden dinleyebilir/indirebilir.
2.  **Preview URL (Tanıtım/Demo):** Herkesin dinleyebildiği kısa versiyondur.
    *   Dosyaları `public/audio/` klasörüne atıp `/audio/sarki.mp3` şeklinde eklemeniz önerilir.
    *   **Not:** YouTube linkleri direkt olarak çalışmaz, mutlaka `.mp3` veya `.wav` bitişli bir dosya linki olmalıdır.

### 3.4 Şarkı Kapak Fotoğrafı
Her şarkı için özel bir görsel belirleyebilirsiniz. Bu görsel, markette şarkı kartının üzerinde ve detay sayfasında görünür. Sanatçı fotoğrafı ile aynı yöntemle (URL veya `/images/...` yolu) eklenir.

### B. Ses Dosyası Ekleme
*   **Full Audio:** Satın alan kişinin erişebileceği tam sürüm.
*   **Preview Audio:** Herkese açık olan kısa önizleme sürümü.
*   URL olarak `public/audio/` altındaki dosyalar veya harici bulut depolama linkleri kullanılır.

---

## 4. Yönetim Panelleri (Studios)

### 4.1 Admin Paneli (`/admin`)
Admin paneli, platformun genel denetimi ve kürasyonu için kullanılır.

*   **Sanatçı Yönetimi & Onboarding (Entegre Kayıt):** 
    *   Sisteme yeni sanatçılar sadece Admin tarafından eklenebilir.
    *   **Yeni Süreç:** Admin, sanatçı eklerken Ad, E-posta, Kullanıcı Adı ve Şifre belirler. 
    *   Sistem otomatik olarak `ARTIST` rolünde bir `User` hesabı oluşturur ve sanatçıya bağlar.
    *   Sanatçı bu bilgilerle direkt giriş yapabilir.
*   **İçerik Kürasyonu:** Admin, tüm sanatçıların albüm ve şarkılarını görebilir, düzenleyebilir veya satıştan kaldırabilir.
*   **Promosyon ve Sponsorluk Sistemi:**
    *   **İndirimler:** Belirli tarihler arası tüm şarkılara veya seçili şarkılara % indirim uygulanabilir.
    *   **Sponsorlu İçerik:** Ana sayfadaki "Sponsorlu" bölümünde hangi şarkıların görüneceği Admin panelinden ayarlanır.
*   **Küresel Analiz:** Platform genelindeki toplam satışlar, toplam komisyon geliri ve aktif kullanıcı sayısı Admin dashboard üzerinden takip edilir.

### 4.2 Sanatçı Paneli (`/artist-admin`)
Sanatçıların kendi dükkanlarını yönettikleri bölümdür.

*   **Profil Yönetimi:** Sanatçı adını, biyografisini ve **profil fotoğrafını** buradan günceller.
### 4.3 İçerik Silme ve Kısıtlamalar
Sistemde hem Admin hem de Sanatçı panelinde silme yetkisi mevcuttur:
*   **Albümü Sil:** Bir albüm silindiğinde içindeki tüm şarkılar da silinir.
*   **Kısıtlama:** Eğer bir şarkı en az bir kullanıcı tarafından **satın alınmışsa**, o şarkı (ve bağlı olduğu albüm) kalıcı olarak silinemez. Bu, satın alan kullanıcının hakkını korumak içindir. Bu durumda şarkıyı silmek yerine "Satışa Kapat" (isAvailable: false) seçeneği kullanılmalıdır.

---

## 5. Kullanıcı Deneyimi Özellikleri
*   **Market:** Dinamik filtreleme ve arama desteği.
*   **Detay Sayfaları:** Her şarkı ve sanatçı için SEO uyumlu, özel detay sayfaları.
*   **Kütüphane & Favoriler:** Satın alınan veya beğenilen içeriklerin kullanıcıya özel listelenmesi.
*   **Dinamik Arka Planlar:** Ana sayfada olduğu gibi, görsel derinlik katan modern tasarım öğeleri.

---

## 6. Geliştirici Notları
Yeni bir özellik eklemek veya veri tabanını güncellemek isterseniz:
1.  `prisma/schema.prisma` dosyasında değişiklik yapın.
2.  Terminalde `npx prisma migrate dev` komutunu çalıştırın.
3.  Admin panelinden verileri test edin.

---

## 7. Projeyi Çalıştırma
Projeyi başka bir bilgisayarda veya yeniden çalıştırmak için şu adımları izle:

1.  **Bağımlılıkları Kur:**
    ```bash
    npm install
    ```
2.  **Veri Tabanını Hazırla:**
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```
3.  **Geliştirme Sunucusunu Başlat:**
    ```bash
    npm run dev
    ```
Sunucu başladıktan sonra `http://localhost:3000` adresinden siteye erişebilirsin.

---
*Küheylan - Müziğin Dijital Mirası*
