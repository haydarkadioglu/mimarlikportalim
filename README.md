# 🏗️ Mimarlık Portalı

Modern mimarlık eğitimi için geliştirilmiş kapsamlı bir online öğrenme platformu. Kullanıcılar çeşitli mimarlık kurslarına kayıt olabilir, satın alabilir ve eğitimlerini takip edebilir.

## 🌟 Özellikler

### 👥 Kullanıcı Özellikleri
- **Kullanıcı Kaydı & Girişi**: Güvenli JWT tabanlı kimlik doğrulama
- **Kurs Görüntüleme**: Tüm mevcut kursları keşfetme
- **Kurs Satın Alma**: Güvenli satın alma sistemi
- **Kişisel Kurs Kütüphanesi**: Satın alınan kursları takip etme
- **Profil Yönetimi**: Kullanıcı bilgilerini güncelleme

### 👨‍💼 Admin Özellikleri
- **Kurs Yönetimi**: Kurs ekleme, düzenleme ve silme
- **İçerik Kontrolü**: Tüm kursları yönetme
- **Kullanıcı İstatistikleri**: Platform kullanım verilerini görüntüleme

### 🛠️ Teknik Özellikler
- **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- **Modern UI**: Tailwind CSS ve Radix UI ile şık arayüz
- **Hızlı Performans**: React ve FastAPI ile optimize edilmiş
- **Güvenli Veritabanı**: SQLite ile güvenli veri saklama

## 🚀 Teknoloji Stack

### Frontend
- **React** - Modern UI kütüphanesi
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Erişilebilir UI komponentleri
- **Axios** - HTTP client
- **React Router** - SPA routing

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM (Object Relational Mapping)
- **SQLite** - Hafif veritabanı
- **JWT** - Token tabanlı kimlik doğrulama
- **Bcrypt** - Şifre hashleme
- **Pydantic** - Veri validasyonu

## 📋 Sistem Gereksinimleri

- **Node.js** 16.x veya üzeri
- **Python** 3.8 veya üzeri
- **npm** veya **yarn**
- **Git**

## 🛠️ Kurulum ve Çalıştırma

### 1️⃣ Projeyi Klonlayın

```bash
git clone https://github.com/haydarkadioglu/mimarlikportalim.git
cd mimarlikportalim
```

### 2️⃣ Backend Kurulumu

```bash
# Backend klasörüne gidin
cd backend

# Python sanal ortamı oluşturun
python -m venv .venv

# Sanal ortamı aktif edin (Windows)
.venv\Scripts\activate

# Sanal ortamı aktif edin (macOS/Linux)
source .venv/bin/activate

# Gerekli paketleri kurun
pip install -r requirements.txt
```

### 3️⃣ Frontend Kurulumu

```bash
# Yeni terminal açın ve frontend klasörüne gidin
cd frontend

# Node.js bağımlılıklarını kurun
npm install --legacy-peer-deps
```

### 4️⃣ Backend'i Çalıştırın

```bash
# Backend klasöründe (.venv aktif olmalı)
cd backend
uvicorn server_sqlite:app --reload --host 0.0.0.0 --port 8000
```

Backend şu adreste çalışacak: **http://localhost:8000**

### 5️⃣ Frontend'i Çalıştırın

```bash
# Yeni terminal açın ve frontend klasöründe
cd frontend
npm start
```

Frontend şu adreste çalışacak: **http://localhost:3000**

## 🌐 API Endpoints

### Kimlik Doğrulama
- `POST /api/register` - Kullanıcı kaydı
- `POST /api/login` - Kullanıcı girişi
- `GET /api/me` - Mevcut kullanıcı bilgisi

### Kurslar
- `GET /api/courses` - Tüm kursları listele
- `GET /api/course/{id}` - Kurs detayını getir
- `POST /api/purchase/{id}` - Kurs satın al
- `GET /api/my-courses` - Satın alınan kurslar

### Admin (Yalnızca admin rolü)
- `GET /api/admin/courses` - Tüm kursları yönet
- `POST /api/admin/courses` - Yeni kurs ekle
- `PUT /api/admin/courses/{id}` - Kurs güncelle
- `DELETE /api/admin/courses/{id}` - Kurs sil

## 👤 Varsayılan Admin Hesabı

Sistem ilk çalıştırıldığında otomatik olarak bir admin hesabı oluşturulur:

- **Email:** admin@mimarim.com
- **Şifre:** admin123

## 📚 API Dokümantasyonu

Backend çalıştırıldıktan sonra Swagger UI dokümantasyonuna erişebilirsiniz:
**http://localhost:8000/docs**

## 🗄️ Veritabanı

Proje SQLite veritabanı kullanır. İlk çalıştırıldığında otomatik olarak `mimarlik_portal.db` dosyası oluşturulur ve gerekli tablolar kurulur:

- **users** - Kullanıcı bilgileri
- **courses** - Kurs bilgileri  
- **purchases** - Satın alma kayıtları

## 🔧 Geliştirme

### Backend Geliştirme
```bash
# Backend'i geliştirme modunda çalıştırın
uvicorn server_sqlite:app --reload

# Yeni bağımlılık ekledikten sonra
pip freeze > requirements.txt
```

### Frontend Geliştirme
```bash
# Frontend'i geliştirme modunda çalıştırın
npm start

# Yeni paket ekledikten sonra
npm install --legacy-peer-deps
```

## 🚀 Production Build

### Frontend Production Build
```bash
cd frontend
npm run build
```

Build dosyaları `frontend/build` klasöründe oluşturulur.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Sahibi: [@haydarkadioglu](https://github.com/haydarkadioglu)

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak teknolojiler kullanılarak geliştirilmiştir:
- React Team
- FastAPI Team
- Tailwind CSS Team
- Radix UI Team
