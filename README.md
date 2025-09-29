# SimpleApi

A simple, secure, and modernized RESTful API built with Node.js, Express, and MySQL.

This README is bilingual. English comes first, followed by Turkish.

---

## English

### Overview

SimpleApi demonstrates production-ready patterns with Express + MySQL: secure configuration, parameterized queries, validation, rate limiting, OpenAPI docs, a robust customers endpoint with pagination/search/sort/filter/field selection, advanced filtering, analytics, health/status, Docker, and developer tooling.

### What’s inside

- Modern dependencies: Express 4.18, mysql2, Helmet, CORS, morgan
- Environment-based configuration via `.env`
- MySQL connection pool (mysql2) with parameterized queries (SQL injection safe)
- Request validation (celebrate/Joi)
- Rate limiting for `/api/*`
- Centralized error handling and consistent 404 responses
- OpenAPI/Swagger docs at `/docs`
- Customers list with pagination, search, secure sorting, filtering, and field selection
- Advanced filtering (JSON) with whitelisted operators (eq, lt, lte, gt, gte, in)
- Analytics endpoints: gender distribution and age bins
- Health/Status with DB ping latency (dbPingMs)
- Docker Compose for local dev (API + MySQL)
- Migration and seed scripts
- Tests (Jest + Supertest), ESLint + Prettier + Husky

### Getting started

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies.
3. (Optional) Set up DB schema and seed data.
4. Run the server.

#### Install

```
npm install
```

#### Run (development with auto-restart)

```
npm run dev
```

#### Run (production)

```
npm start
```

The server listens on `PORT` from `.env` or `3000` by default.

#### Database: migrate and seed

```
npm run db:migrate   # apply schema from customer.sql
npm run db:seed      # insert sample data
npm run db:setup     # migrate + seed
```

### Environment variables

Common variables (with typical defaults):

- `PORT` (default: 3000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (default: 3306)
- `CORS_ORIGINS` (comma-separated list; in development `*` is allowed)
- `CORS_CREDENTIALS` (true/false)
- `RATE_LIMIT_WINDOW_MS` (default: 900000)
- `RATE_LIMIT_MAX` (default: 100 in production, 1000 in dev/test)
- `SWAGGER_SERVER_URL` (optional: overrides the server URL used by Swagger UI; default is `http://localhost:PORT`)

### API docs

Open Swagger UI:

- http://localhost:3000/docs

#### Swagger settings

- UI path: `/docs`
- Spec generator: `swagger-jsdoc`
  - `openapi`: `3.0.0`
  - `servers`: `[ { url: process.env.SWAGGER_SERVER_URL || \`http://localhost:${PORT}\` } ]`
  - `apis`: `./app/routes/*.js` (JSDoc annotations are parsed from route files)
  - `components.schemas`: `Customer`, `CustomerCreate`
- UI options: `explorer: true` (search/filter on the left sidebar)

Tips:

- When running behind a reverse proxy or accessing from another host, set `SWAGGER_SERVER_URL` (e.g., `https://api.example.com`) so "Try it out" calls the correct base URL.
- If Swagger UI is served from a different origin than the API, make sure CORS allows that origin.

### Endpoints overview

- `GET /api/customers` — list customers (see parameters below)
- `POST /api/customers` — create
- `GET /api/customers/:customerId` — get by id
- `PUT /api/customers/:customerId` — update
- `DELETE /api/customers/:customerId` — delete by id
- `DELETE /api/customers` — delete all
- `GET /api/customers/stats/gender` — counts by gender
- `GET /api/customers/stats/age` — counts by age bins
- Health/Status: `GET /api/health`, `GET /api/health/ready`, `GET /api/health/live`, `GET /api/status`
- Utilities: `GET /api/version`, `POST /api/echo`, `GET /api/time/now`, `GET /api/metrics`

### Customers list (detailed)

Query parameters (all optional):

- Pagination: `page`, `pageSize`
- Search: `search` (applies to name or surname using LIKE)
- Sorting: `sortBy` in [id, name, surname, age, gender], `order` in [asc, desc]
- Basic filters: `gender` in [male, female, other], `minAge`, `maxAge`
- Field selection: `fields` as comma-separated values from [id, name, surname, age, gender]
- Advanced filtering: `advancedFilter` as a JSON string with whitelisted fields/operators

Response metadata:

- `total`: total items
- `totalPages`: total page count
- `page`, `pageSize`
- `returnedFieldsCount`: number of fields in each row (varies with `fields`)

#### Advanced filter examples

1. Age >= 18 and gender = female

```
/api/customers?advancedFilter={"age.gte":18,"gender.eq":"female"}
```

2. Surname IN (Yılmaz, Kaya) and only return id,name,age

```
/api/customers?fields=id,name,age&advancedFilter={"surname.in":["Yılmaz","Kaya"]}
```

3. Age between 20 and 30 (gt/lte) and name IN (Ali, Veli)

```
/api/customers?advancedFilter={"age.gt":20,"age.lte":30,"name.in":["Ali","Veli"]}
```

### Security notes

- All DB queries are parameterized (`?`). User input is never concatenated into SQL strings.
- `advancedFilter` is protected by field/operator whitelists, type/length validation, and limits (max conditions and IN-list size). Invalid keys are ignored.
- `sortBy` and `order` use whitelists so only allowed columns/directions are applied to SQL.
- CORS and rate limit policies are environment-driven and can be tightened for production.

### Docker (optional)

```
docker compose up --build
```

- API: http://localhost:3000
- MySQL: localhost:3306 (use root/password or values from `.env`)

### Database schema

- The API expects a `customer` table: `id` (PK, AUTO_INCREMENT), `customer_name`, `customer_surname`, `customer_age`, `customer_gender` (ENUM: male, female, other).
- See `customer.sql` for schema and a starter row.

### Testing & linting

```
npm test           # run Jest + Supertest
npm run lint       # ESLint check
npm run lint:fix   # auto-fix lint issues
npm run format     # Prettier format
```

### Scripts

- `npm run db:migrate` — create database (if needed) and apply `customer.sql`
- `npm run db:seed` — insert sample rows
- `npm run db:setup` — migrate + seed

---

## Türkçe

### Genel Bakış

SimpleApi, Express + MySQL ile üretime hazır kalıpları gösterir: güvenli yapılandırma, parametreli sorgular, doğrulama, rate limiting, OpenAPI dokümantasyonu, sayfalama/arama/sıralama/filtre/alan seçimi olan güçlü bir müşteri uç noktası, gelişmiş filtreleme, analitik, sağlık/durum uçları, Docker ve geliştirici araçları.

### İçerik

- Güncel bağımlılıklar: Express 4.18, mysql2, Helmet, CORS, morgan
- `.env` ile ortam bazlı yapılandırma
- MySQL havuzu (mysql2) ve parametreli sorgular (SQL injection’a karşı güvenli)
- İstek doğrulama (celebrate/Joi)
- `/api/*` için rate limit
- Merkezî hata yakalama ve tutarlı 404’ler
- OpenAPI/Swagger dokümanı: `/docs`
- Müşteri listesi: sayfalama, arama, güvenli sıralama, filtreleme ve alan seçimi
- Gelişmiş filtreleme (JSON) ve whitelist operatörleri (eq, lt, lte, gt, gte, in)
- Analitik uçlar: cinsiyete göre dağılım ve yaş aralıkları
- Health/Status içinde DB ping süresi (dbPingMs)
- Yerel geliştirme için Docker Compose (API + MySQL)
- Migrasyon ve seed script’leri
- Testler (Jest + Supertest), ESLint + Prettier + Husky

### Başlangıç

1. `.env.example` dosyasını `.env` olarak kopyalayın ve değerleri güncelleyin.
2. Bağımlılıkları yükleyin.
3. (Opsiyonel) Şemayı uygulayın ve örnek verileri ekleyin.
4. Sunucuyu çalıştırın.

#### Kurulum

```
npm install
```

#### Çalıştır (geliştirme – otomatik yeniden başlatma)

```
npm run dev
```

#### Çalıştır (üretim)

```
npm start
```

Sunucu varsayılan olarak `.env` içindeki `PORT`’u veya 3000’i dinler.

#### Veritabanı: migrasyon ve seed

```
npm run db:migrate   # customer.sql şemasını uygular
npm run db:seed      # örnek verileri ekler
npm run db:setup     # migrate + seed
```

### Ortam Değişkenleri

Sık kullanılan değişkenler (tipik varsayılanlarla):

- `PORT` (varsayılan: 3000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (varsayılan: 3306)
- `CORS_ORIGINS` (virgülle ayrılmış liste; geliştirmede `*` kabul edilebilir)
- `CORS_CREDENTIALS` (true/false)
- `RATE_LIMIT_WINDOW_MS` (varsayılan: 900000)
- `RATE_LIMIT_MAX` (varsayılan: prod 100, dev/test 1000)
- `SWAGGER_SERVER_URL` (opsiyonel: Swagger UI'da kullanılacak sunucu adresini değiştirir; varsayılan `http://localhost:PORT`)

### API Dokümantasyonu

Swagger UI:

- http://localhost:3000/docs

#### Swagger ayarları

- UI yolu: `/docs`
- Spec üretimi: `swagger-jsdoc`
  - `openapi`: `3.0.0`
  - `servers`: `[ { url: process.env.SWAGGER_SERVER_URL || \`http://localhost:${PORT}\` } ]`
  - `apis`: `./app/routes/*.js` (JSDoc açıklamaları route dosyalarından okunur)
  - `components.schemas`: `Customer`, `CustomerCreate`
- UI seçenekleri: `explorer: true` (sol tarafta arama/filtre)

İpuçları:

- Ters proxy arkasında çalışırken veya farklı bir hosttan erişirken, "Try it out" doğru tabanı kullansın diye `SWAGGER_SERVER_URL` ayarlayın (örn. `https://api.example.com`).
- Swagger UI farklı bir origin'den servis ediliyorsa, CORS'un bu origin'e izin verdiğinden emin olun.

### Uç Noktalar (Özet)

- `GET /api/customers` — müşterileri listele (parametreler aşağıda)
- `POST /api/customers` — oluştur
- `GET /api/customers/:customerId` — id ile getir
- `PUT /api/customers/:customerId` — güncelle
- `DELETE /api/customers/:customerId` — id ile sil
- `DELETE /api/customers` — hepsini sil
- `GET /api/customers/stats/gender` — cinsiyete göre sayılar
- `GET /api/customers/stats/age` — yaş aralığına göre sayılar
- Sağlık/Durum: `GET /api/health`, `GET /api/health/ready`, `GET /api/health/live`, `GET /api/status`
- Araçlar: `GET /api/version`, `POST /api/echo`, `GET /api/time/now`, `GET /api/metrics`

### Müşteri Listesi (Detaylı)

Sorgu parametreleri (hepsi opsiyonel):

- Sayfalama: `page`, `pageSize`
- Arama: `search` (isim veya soyisim üzerinde LIKE)
- Sıralama: `sortBy` [id, name, surname, age, gender], `order` [asc, desc]
- Temel filtreler: `gender` [male, female, other], `minAge`, `maxAge`
- Alan seçimi: `fields` — [id, name, surname, age, gender] listesinden virgülle ayrılmış
- Gelişmiş filtreleme: `advancedFilter` — whitelist alan/operatörlerle JSON string

Yanıt meta bilgisi:

- `total`: toplam kayıt
- `totalPages`: toplam sayfa
- `page`, `pageSize`
- `returnedFieldsCount`: dönen satırdaki alan sayısı (fields’a göre değişir)

#### Gelişmiş filtre örnekleri

1. Yaş >= 18 ve cinsiyet = female

```
/api/customers?advancedFilter={"age.gte":18,"gender.eq":"female"}
```

2. Soyisim IN (Yılmaz, Kaya) ve sadece id,name,age alanlarını döndür

```
/api/customers?fields=id,name,age&advancedFilter={"surname.in":["Yılmaz","Kaya"]}
```

3. Yaş 20 ile 30 arasında (gt/lte) ve isim IN (Ali, Veli)

```
/api/customers?advancedFilter={"age.gt":20,"age.lte":30,"name.in":["Ali","Veli"]}
```

### Güvenlik Notları

- Tüm DB sorguları parametreli (`?`) çalışır; kullanıcı girdisi SQL stringine eklenmez.
- `advancedFilter` alan/operatör whitelist’i, tip/uzunluk doğrulaması ve limitlerle korunur (maks. koşul sayısı ve IN listesi boyutu). Geçersiz anahtarlar yok sayılır.
- `sortBy` ve `order` whitelist ile yalnızca izinli kolon/yön kombinasyonlarına izin verir.
- CORS ve rate limit politikaları ortam değişkenleri ile yönetilir ve prod’da sıkılaştırılabilir.

### Docker (Opsiyonel)

```
docker compose up --build
```

- API: http://localhost:3000
- MySQL: localhost:3306 (root/password veya `.env` değerleri)

### Veritabanı Şeması

- API bir `customer` tablosu bekler: `id` (PK, AUTO_INCREMENT), `customer_name`, `customer_surname`, `customer_age`, `customer_gender` (ENUM: male, female, other).
- Şema ve örnek kayıt için `customer.sql` dosyasına bakın.

### Test & Lint

```
npm test           # Jest + Supertest
npm run lint       # ESLint kontrol
npm run lint:fix   # otomatik düzeltme
npm run format     # Prettier formatlama
```

### Komutlar

- `npm run db:migrate` — veritabanını (gerekirse) oluştur ve `customer.sql` uygula
- `npm run db:seed` — örnek kayıtlar ekle
- `npm run db:setup` — migrate + seed

---

MIT License. Contributions welcome.
