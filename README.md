# SimpleApi

A simple, secure, and modernized RESTful API built with Node.js, Express, and MySQL.

This README is bilingual. English comes first, followed by Turkish.

---

## English

### Overview

SimpleApi demonstrates production-ready patterns with Express + MySQL: secure configuration, parameterized queries, validation, rate limiting, OpenAPI docs, a robust customers endpoint with pagination/search/sort/filter/field selection, advanced filtering, analytics, health/status, Docker, and developer tooling.

### What’s inside

- Modern dependencies: Express 5, mysql2, Helmet 8, CORS, morgan (0 known npm advisories)
- Environment-based configuration via `.env`
- API-key authentication on every write endpoint (fail-closed in production)
- MySQL connection pool (mysql2) with parameterized queries (SQL injection safe)
- Request validation (celebrate/Joi), unknown query parameters rejected
- Rate limiting for `/api/*` plus a wider global budget
- Centralized error handling that never leaks driver/SQL internals
- Graceful shutdown (SIGTERM/SIGINT) with connection draining
- OpenAPI/Swagger docs at `/docs`
- Customers list with pagination, search, secure sorting, filtering, and field selection
- Advanced filtering (JSON) with whitelisted operators (eq, lt, lte, gt, gte, in)
- Analytics endpoints: gender distribution and age bins
- Health/Status with DB ping latency (dbPingMs)
- Docker Compose for local dev (API + MySQL)
- Migration and seed scripts
- Tests (Jest + Supertest), ESLint + Prettier + Husky

### Requirements

- Node.js >= 20 (Express 5 and celebrate 16 require it)
- MySQL 8

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

### Authentication

Write endpoints (`POST`, `PUT`, `DELETE` on `/api/customers`) require an API key.
Read endpoints stay open.

Generate a key and put it in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Send it as either header:

```
X-API-Key: <your key>
Authorization: Bearer <your key>
```

Behaviour when `API_KEY` is not set:

| Environment      | Result                                                         |
| ---------------- | -------------------------------------------------------------- |
| production       | Writes return `503` (fail-closed)                              |
| development/test | Writes are allowed, with a startup warning (local convenience) |

### Environment variables

Full list with defaults lives in `.env.example`.

| Variable                                     | Default                        | Notes                                                           |
| -------------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `PORT`                                       | `3000`                         |                                                                 |
| `NODE_ENV`                                   | `development`                  | `production` tightens several defaults                          |
| `API_KEY`                                    | _(unset)_                      | Required for writes; production fails closed without it         |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD`        | `localhost` / `root` / _empty_ |                                                                 |
| `DB_NAME` / `DB_PORT`                        | `simpleapi` / `3306`           |                                                                 |
| `DB_CONNECTION_LIMIT` / `DB_CONNECT_TIMEOUT` | `10` / `10000`                 |                                                                 |
| `DB_SSL` / `DB_SSL_REJECT_UNAUTHORIZED`      | `false` / `true`               | Enable TLS for any non-local database                           |
| `CORS_ORIGINS`                               | `*` in dev, empty in prod      | Comma-separated. `*` is rejected in production                  |
| `CORS_CREDENTIALS`                           | `false`                        | Cannot be combined with `*` — the app refuses to start          |
| `RATE_LIMIT_WINDOW_MS`                       | `900000`                       |                                                                 |
| `RATE_LIMIT_MAX`                             | `100` prod / `1000` dev        | `/api/*` budget; other paths get 5x                             |
| `TRUST_PROXY`                                | `false`                        | `true`, a hop count, or a CIDR list. Only enable behind a proxy |
| `BODY_LIMIT`                                 | `100kb`                        | Max request body size                                           |
| `ENABLE_DOCS`                                | on in dev, off in prod         | Serves Swagger UI at `/docs`                                    |
| `ENABLE_ECHO`                                | on in dev, off in prod         | Serves the `/api/echo` debug endpoint                           |
| `SWAGGER_SERVER_URL`                         | `http://localhost:PORT`        | Set when behind a proxy or on another host                      |

> **`TRUST_PROXY` matters for rate limiting.** Leave it `false` when the app is
> directly exposed: enabling it lets clients forge `X-Forwarded-For` and get a
> fresh rate-limit bucket per request. Set it only when a proxy you control
> rewrites that header.

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

| Method   | Path                          | Auth | Description              |
| -------- | ----------------------------- | ---- | ------------------------ |
| `GET`    | `/api/customers`              | —    | List (parameters below)  |
| `POST`   | `/api/customers`              | Key  | Create                   |
| `GET`    | `/api/customers/:customerId`  | —    | Get by id                |
| `PUT`    | `/api/customers/:customerId`  | Key  | Update                   |
| `DELETE` | `/api/customers/:customerId`  | Key  | Delete by id             |
| `DELETE` | `/api/customers`              | Key  | Delete all (destructive) |
| `GET`    | `/api/customers/stats/gender` | —    | Counts by gender         |
| `GET`    | `/api/customers/stats/age`    | —    | Counts by age bins       |

- Health/Status: `GET /api/health`, `GET /api/health/ready`, `GET /api/health/live`, `GET /api/status`
- Utilities: `GET /api/version`, `POST /api/echo`, `GET /api/time/now`, `GET /api/metrics`

`POST /api/echo` and `/docs` are development aids and return `404` in production
unless `ENABLE_ECHO` / `ENABLE_DOCS` are explicitly turned on.

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

**Queries**

- All DB queries are parameterized (`?`). User input is never concatenated into SQL strings.
- `advancedFilter` is protected by field/operator whitelists, type/length validation, and limits (max conditions and IN-list size). Invalid keys are ignored.
- Whitelist lookups use own-property checks, so keys like `constructor` or `__proto__` cannot resolve to an inherited value and reach the SQL string.
- `search` escapes LIKE metacharacters (`%`, `_`) with an explicit `ESCAPE '!'`, so input cannot widen the match or force a scan.
- `sortBy`, `order` and `fields` use whitelists so only allowed columns/directions are applied to SQL.
- The pool sets `multipleStatements: false`, so stacked statements are rejected at the driver.

**Responses**

- 5xx responses are always `{"message":"Internal Server Error"}`. Driver messages, SQL text and stack traces are logged server-side only.
- `/api/echo` redacts `Authorization`, `Cookie`, `X-API-Key` and similar headers.
- `/api/version` omits the Node.js runtime version in production.

**Transport and access**

- Write endpoints require an API key, compared in constant time.
- CORS is an explicit allow-list; a rejected origin gets a clean `403`, not a `500`. Wildcard origins are refused in production and can never be combined with credentials.
- Rate limiting covers `/api/*` and, with a wider budget, every other path.
- Helmet sets a Content Security Policy; `/docs` gets its own slightly looser policy rather than weakening it globally.
- Request bodies are capped (`BODY_LIMIT`, default 100kb).

**Supply chain**

- `npm audit` reports 0 vulnerabilities. Run `npm run audit` in CI to keep it that way.

### Docker (optional)

`.env` must define `DB_PASSWORD` and `API_KEY` — compose refuses to start without
them rather than falling back to a weak default.

```
docker compose up --build
```

- API: http://localhost:3000
- MySQL: 127.0.0.1:3306 (bound to loopback, not exposed to the network)

The image runs as the non-root `node` user with a read-only root filesystem, and
`.dockerignore` keeps `.env` out of the build context.

### Database schema

- The API expects a `customer` table: `id` (PK, AUTO_INCREMENT), `customer_name`, `customer_surname`, `customer_age`, `customer_gender` (ENUM: male, female, other).
- See `customer.sql` for schema and a starter row.

### Testing & linting

```
npm test              # run Jest + Supertest
npm run test:coverage # with coverage
npm run lint          # ESLint check
npm run lint:fix      # auto-fix lint issues
npm run format        # Prettier format
npm run audit         # fail on high-severity dependency advisories
```

`tests/security.test.js` and `tests/cors.test.js` are regression tests for the
hardening above: header redaction, the API-key guard, error-message leakage,
LIKE/prototype-key handling and the CORS allow-list.

### Scripts

- `npm run db:migrate` — create database (if needed) and apply `customer.sql`
- `npm run db:seed` — insert sample rows
- `npm run db:setup` — migrate + seed

---

## Türkçe

### Genel Bakış

SimpleApi, Express + MySQL ile üretime hazır kalıpları gösterir: güvenli yapılandırma, parametreli sorgular, doğrulama, rate limiting, OpenAPI dokümantasyonu, sayfalama/arama/sıralama/filtre/alan seçimi olan güçlü bir müşteri uç noktası, gelişmiş filtreleme, analitik, sağlık/durum uçları, Docker ve geliştirici araçları.

### İçerik

- Güncel bağımlılıklar: Express 5, mysql2, Helmet 8, CORS, morgan (bilinen npm açığı yok)
- `.env` ile ortam bazlı yapılandırma
- Tüm yazma uçlarında API anahtarı doğrulaması (üretimde fail-closed)
- MySQL havuzu (mysql2) ve parametreli sorgular (SQL injection’a karşı güvenli)
- İstek doğrulama (celebrate/Joi); bilinmeyen sorgu parametreleri reddedilir
- `/api/*` için rate limit ve tüm yollar için daha geniş bir global limit
- Sürücü/SQL ayrıntılarını sızdırmayan merkezî hata yakalama
- Bağlantıları boşaltarak düzgün kapanma (SIGTERM/SIGINT)
- OpenAPI/Swagger dokümanı: `/docs`
- Müşteri listesi: sayfalama, arama, güvenli sıralama, filtreleme ve alan seçimi
- Gelişmiş filtreleme (JSON) ve whitelist operatörleri (eq, lt, lte, gt, gte, in)
- Analitik uçlar: cinsiyete göre dağılım ve yaş aralıkları
- Health/Status içinde DB ping süresi (dbPingMs)
- Yerel geliştirme için Docker Compose (API + MySQL)
- Migrasyon ve seed script’leri
- Testler (Jest + Supertest), ESLint + Prettier + Husky

### Gereksinimler

- Node.js >= 20 (Express 5 ve celebrate 16 bunu gerektirir)
- MySQL 8

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

### Kimlik Doğrulama

Yazma uçları (`/api/customers` üzerinde `POST`, `PUT`, `DELETE`) API anahtarı ister.
Okuma uçları açık kalır.

Anahtar üretip `.env` içine koyun:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

İki başlıktan biriyle gönderin:

```
X-API-Key: <anahtarınız>
Authorization: Bearer <anahtarınız>
```

`API_KEY` tanımlı değilse:

| Ortam            | Sonuç                                                          |
| ---------------- | -------------------------------------------------------------- |
| production       | Yazma işlemleri `503` döner (fail-closed)                      |
| development/test | Yazma işlemleri uyarı ile birlikte serbesttir (yerel kolaylık) |

### Ortam Değişkenleri

Varsayılanların tam listesi `.env.example` içindedir.

| Değişken                                     | Varsayılan                   | Not                                                            |
| -------------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `PORT`                                       | `3000`                       |                                                                |
| `NODE_ENV`                                   | `development`                | `production` birçok varsayılanı sıkılaştırır                   |
| `API_KEY`                                    | _(tanımsız)_                 | Yazma için gerekli; üretimde yoksa yazma kapalıdır             |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD`        | `localhost` / `root` / _boş_ |                                                                |
| `DB_NAME` / `DB_PORT`                        | `simpleapi` / `3306`         |                                                                |
| `DB_CONNECTION_LIMIT` / `DB_CONNECT_TIMEOUT` | `10` / `10000`               |                                                                |
| `DB_SSL` / `DB_SSL_REJECT_UNAUTHORIZED`      | `false` / `true`             | Yerel olmayan her veritabanı için TLS açın                     |
| `CORS_ORIGINS`                               | dev'de `*`, prod'da boş      | Virgülle ayrılır. `*` üretimde reddedilir                      |
| `CORS_CREDENTIALS`                           | `false`                      | `*` ile birlikte kullanılamaz — uygulama başlamayı reddeder    |
| `RATE_LIMIT_WINDOW_MS`                       | `900000`                     |                                                                |
| `RATE_LIMIT_MAX`                             | prod `100` / dev `1000`      | `/api/*` bütçesi; diğer yollar 5 katı                          |
| `TRUST_PROXY`                                | `false`                      | `true`, hop sayısı veya CIDR listesi. Yalnızca proxy arkasında |
| `BODY_LIMIT`                                 | `100kb`                      | En büyük istek gövdesi                                         |
| `ENABLE_DOCS`                                | dev'de açık, prod'da kapalı  | `/docs` altında Swagger UI                                     |
| `ENABLE_ECHO`                                | dev'de açık, prod'da kapalı  | `/api/echo` hata ayıklama ucu                                  |
| `SWAGGER_SERVER_URL`                         | `http://localhost:PORT`      | Proxy arkasında veya farklı hostta ayarlayın                   |

> **`TRUST_PROXY` rate limit için kritiktir.** Uygulama doğrudan dışarı açıksa
> `false` bırakın: açtığınızda istemciler `X-Forwarded-For` başlığını taklit edip
> her istekte yeni bir limit kovası alabilir. Yalnızca bu başlığı sizin
> kontrolünüzdeki bir proxy yazıyorsa açın.

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

| Metot    | Yol                           | Yetki   | Açıklama                     |
| -------- | ----------------------------- | ------- | ---------------------------- |
| `GET`    | `/api/customers`              | —       | Listele (parametreler altta) |
| `POST`   | `/api/customers`              | Anahtar | Oluştur                      |
| `GET`    | `/api/customers/:customerId`  | —       | Id ile getir                 |
| `PUT`    | `/api/customers/:customerId`  | Anahtar | Güncelle                     |
| `DELETE` | `/api/customers/:customerId`  | Anahtar | Id ile sil                   |
| `DELETE` | `/api/customers`              | Anahtar | Hepsini sil (yıkıcı)         |
| `GET`    | `/api/customers/stats/gender` | —       | Cinsiyete göre sayılar       |
| `GET`    | `/api/customers/stats/age`    | —       | Yaş aralığına göre sayılar   |

- Sağlık/Durum: `GET /api/health`, `GET /api/health/ready`, `GET /api/health/live`, `GET /api/status`
- Araçlar: `GET /api/version`, `POST /api/echo`, `GET /api/time/now`, `GET /api/metrics`

`POST /api/echo` ve `/docs` geliştirme amaçlıdır; `ENABLE_ECHO` / `ENABLE_DOCS`
açıkça açılmadıkça üretimde `404` döner.

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

**Sorgular**

- Tüm DB sorguları parametreli (`?`) çalışır; kullanıcı girdisi SQL stringine eklenmez.
- `advancedFilter` alan/operatör whitelist’i, tip/uzunluk doğrulaması ve limitlerle korunur (maks. koşul sayısı ve IN listesi boyutu). Geçersiz anahtarlar yok sayılır.
- Whitelist aramaları own-property kontrolü yapar; `constructor` veya `__proto__` gibi anahtarlar prototipten bir değere çözülüp SQL stringine ulaşamaz.
- `search` içindeki LIKE meta karakterleri (`%`, `_`) açık `ESCAPE '!'` ile kaçırılır; girdi eşleşmeyi genişletemez veya tarama zorlayamaz.
- `sortBy`, `order` ve `fields` whitelist kullanır; yalnızca izinli kolon/yön SQL’e girer.
- Havuz `multipleStatements: false` ile çalışır; zincirlenmiş ifadeler sürücü seviyesinde reddedilir.

**Yanıtlar**

- 5xx yanıtları her zaman `{"message":"Internal Server Error"}` döner. Sürücü mesajları, SQL metni ve stack trace yalnızca sunucu tarafında loglanır.
- `/api/echo`, `Authorization`, `Cookie`, `X-API-Key` ve benzeri başlıkları maskeler.
- `/api/version` üretimde Node.js sürümünü göstermez.

**Taşıma ve erişim**

- Yazma uçları API anahtarı ister; karşılaştırma sabit zamanlıdır.
- CORS açık bir izin listesidir; reddedilen origin `500` değil temiz bir `403` alır. Joker origin üretimde reddedilir ve kimlik bilgileriyle asla birleştirilemez.
- Rate limit `/api/*` ve daha geniş bir bütçeyle diğer tüm yolları kapsar.
- Helmet bir Content Security Policy uygular; `/docs` politikayı global olarak zayıflatmak yerine kendi biraz daha gevşek politikasını alır.
- İstek gövdeleri sınırlıdır (`BODY_LIMIT`, varsayılan 100kb).

**Tedarik zinciri**

- `npm audit` 0 açık bildirir. CI’da `npm run audit` çalıştırarak bu durumu koruyun.

### Docker (Opsiyonel)

`.env` içinde `DB_PASSWORD` ve `API_KEY` tanımlı olmalıdır — compose zayıf bir
varsayılana düşmek yerine başlamayı reddeder.

```
docker compose up --build
```

- API: http://localhost:3000
- MySQL: 127.0.0.1:3306 (yalnızca loopback’e bağlı, ağa açık değil)

İmaj root olmayan `node` kullanıcısıyla ve salt okunur kök dosya sistemiyle
çalışır; `.dockerignore` `.env` dosyasının build context’ine girmesini engeller.

### Veritabanı Şeması

- API bir `customer` tablosu bekler: `id` (PK, AUTO_INCREMENT), `customer_name`, `customer_surname`, `customer_age`, `customer_gender` (ENUM: male, female, other).
- Şema ve örnek kayıt için `customer.sql` dosyasına bakın.

### Test & Lint

```
npm test              # Jest + Supertest
npm run test:coverage # kapsam raporu ile
npm run lint          # ESLint kontrol
npm run lint:fix      # otomatik düzeltme
npm run format        # Prettier formatlama
npm run audit         # yüksek önemli bağımlılık açıklarında hata verir
```

`tests/security.test.js` ve `tests/cors.test.js` yukarıdaki sıkılaştırmaların
regresyon testleridir: başlık maskeleme, API anahtarı koruması, hata mesajı
sızıntısı, LIKE/prototip anahtarı işleme ve CORS izin listesi.

### Komutlar

- `npm run db:migrate` — veritabanını (gerekirse) oluştur ve `customer.sql` uygula
- `npm run db:seed` — örnek kayıtlar ekle
- `npm run db:setup` — migrate + seed

---

MIT License. Contributions welcome.
