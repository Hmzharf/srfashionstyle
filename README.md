# Dokumentasi Pengujian API — SRFashionStyle

> **Tanggal**: 23 Juni 2026
> **Lingkup**: Seluruh API endpoint backend Laravel
> **Tujuan**: Dokumen pengujian untuk BAB Pengujian laporan Kerja Praktek

**Keterangan Kolom:**
- **ID**: Identitas unik test case (`AUTH-01`, `ORD-05`, dsb.)
- **Skenario**: Positif (happy path) atau Negatif (error/edge-case)
- **Prekondisi / Input**: Data yang diperlukan sebelum test, termasuk request body & header
- **Hasil Diharapkan**: Response status code, struktur JSON, dan pesan yang diharapkan
- **Hasil Aktual**: (diisi saat pengujian)
- **Status**: ✅ Pass / ❌ Fail (diisi saat pengujian)

---

## 1. Health Check

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| HLT-01 | Positif — Cek koneksi backend | `GET /api/health` | Tidak ada | **200 OK** — `{"message": "Backend Laravel terkoneksi"}` | | |

---

## 2. Autentikasi — Publik

### 2.1 Register

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-01 | Positif — Register data lengkap dan valid | `POST /api/register` | `{ name, email, phone, password, password_confirmation }` — email belum terdaftar, password ≥8 karakter, password_confirmation cocok | **201 Created** — `message: "Register berhasil. Kode OTP verifikasi telah dikirim ke email."`, `token`, `user`, `requires_email_verification: true` | | |
| AUTH-02 | Negatif — Email sudah terdaftar | `POST /api/register` | Email yang sudah ada di tabel `users` | **422 Unprocessable** — `errors.email` berisi pesan "The email has already been taken." | | |
| AUTH-03 | Negatif — Password terlalu pendek | `POST /api/register` | `password: "12345"` (kurang dari 8 karakter) | **422 Unprocessable** — `errors.password` berisi pesan minimal 8 karakter | | |
| AUTH-04 | Negatif — Password confirmation tidak cocok | `POST /api/register` | `password ≠ password_confirmation` | **422 Unprocessable** — `errors.password` berisi pesan "The password confirmation does not match." | | |
| AUTH-05 | Negatif — Nama kosong | `POST /api/register` | `name: ""` | **422 Unprocessable** — `errors.name` berisi pesan required | | |
| AUTH-06 | Negatif — Format email tidak valid | `POST /api/register` | `email: "bukan-email"` | **422 Unprocessable** — `errors.email` berisi pesan format email | | |
| AUTH-07 | Negatif — Rate limit (5× percobaan) | `POST /api/register` | Kirim 6 request berturut-turut dengan email/IP sama dalam 60 detik | **429 Too Many Requests** — `message: "Terlalu banyak percobaan register. Silakan coba lagi beberapa saat."` | | |

### 2.2 Login

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-08 | Positif — Login kredensial valid & email terverifikasi | `POST /api/login` | `{ email, password }` — user terdaftar dengan `email_verified_at ≠ null` | **200 OK** — `message: "Login berhasil"`, `token`, `user` (tanpa `requires_email_verification`) | | |
| AUTH-09 | Positif — Login kredensial valid & email belum terverifikasi | `POST /api/login` | `{ email, password }` — user terdaftar dengan `email_verified_at = null` | **403 Forbidden** — `message: "Email belum diverifikasi."`, `token`, `user`, `requires_email_verification: true` | | |
| AUTH-10 | Negatif — Email tidak terdaftar | `POST /api/login` | Email yang tidak ada di database | **422 Unprocessable** — `errors.email: ["Email atau password salah."]` | | |
| AUTH-11 | Negatif — Password salah | `POST /api/login` | Email valid tetapi password tidak cocok | **422 Unprocessable** — `errors.email: ["Email atau password salah."]` | | |
| AUTH-12 | Negatif — Email kosong | `POST /api/login` | `email: ""` | **422 Unprocessable** — validasi required | | |
| AUTH-13 | Negatif — Rate limit (5× percobaan) | `POST /api/login` | 6 request gagal berturut-turut dengan email/IP sama dalam 60 detik | **429 Too Many Requests** — `message: "Terlalu banyak percobaan login. Silakan coba lagi beberapa saat."` | | |

### 2.3 Forgot Password

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-14 | Positif — Email terdaftar | `POST /api/forgot-password` | `{ email }` — email yang terdaftar di `users` | **200 OK** — `message: "Jika email terdaftar, link reset password telah dikirim."` (tidak membocorkan apakah email ada/tidak) | | |
| AUTH-15 | Positif — Email tidak terdaftar | `POST /api/forgot-password` | `{ email }` — email yang TIDAK terdaftar | **200 OK** — `message: "Jika email terdaftar, link reset password telah dikirim."` (response sama) | | |
| AUTH-16 | Negatif — Format email tidak valid | `POST /api/forgot-password` | `email: "bukan-email"` | **422 Unprocessable** — validasi format email | | |
| AUTH-17 | Negatif — Rate limit (5× percobaan) | `POST /api/forgot-password` | 6 request berturut-turut dalam 60 detik | **429 Too Many Requests** — `message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat."` | | |

### 2.4 Reset Password

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-18 | Positif — Token valid, password baru cocok | `POST /api/reset-password` | `{ token, email, password, password_confirmation }` — token dari email reset, minimal 8 karakter, confirmed cocok | **200 OK** — `message: "Password berhasil direset."` | | |
| AUTH-19 | Negatif — Token tidak valid / kadaluarsa | `POST /api/reset-password` | Token yang sudah dipakai atau kadaluarsa | **422 Unprocessable** — `message` berisi pesan error dari Laravel Password broker (mis. "This password reset token is invalid.") | | |
| AUTH-20 | Negatif — Email tidak sesuai dengan token | `POST /api/reset-password` | Email berbeda dengan yang digunakan saat meminta reset | **422 Unprocessable** — pesan error Password broker | | |
| AUTH-21 | Negatif — Password baru < 8 karakter | `POST /api/reset-password` | `password: "1234567"` | **422 Unprocessable** — validasi minimal 8 karakter | | |

---

## 3. Autentikasi — Terproteksi (Bearer Token)

### 3.1 Me / Profil

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-22 | Positif — Ambil data user sendiri | `GET /api/me` | Header: `Authorization: Bearer <token>` | **200 OK** — `{ user: { id, name, email, phone, role, ... } }` | | |
| AUTH-23 | Negatif — Tanpa token | `GET /api/me` | Tanpa header Authorization | **401 Unauthorized** — `message: "Unauthenticated."` | | |
| AUTH-24 | Negatif — Token kadaluarsa / tidak valid | `GET /api/me` | Token yang sudah di-revoke atau invalid | **401 Unauthorized** — `message: "Unauthenticated."` | | |

### 3.2 Update Profil

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-25 | Positif — Update profil lengkap | `PUT /api/me/profile` | `{ name, email, phone, address, city, postal_code }` — semua valid | **200 OK** — `message: "Profil berhasil diperbarui"`, `user`, `requires_email_verification` (false jika email tidak berubah) | | |
| AUTH-26 | Positif — Ganti email (trigger verifikasi ulang) | `PUT /api/me/profile` | `{ email: "baru@email.com", ... }` — email berbeda dari sebelumnya | **200 OK** — `requires_email_verification: true`, OTP dikirim ke email baru | | |
| AUTH-27 | Negatif — Email bentrok dengan user lain | `PUT /api/me/profile` | Email yang sudah dipakai user lain | **422 Unprocessable** — `errors.email: ["The email has already been taken."]` | | |
| AUTH-28 | Negatif — Nama kosong | `PUT /api/me/profile` | `name: ""` | **422 Unprocessable** — `errors.name` required | | |

### 3.3 Change Password

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-29 | Positif — Password lama benar, baru valid | `PUT /api/me/password` | `{ current_password, new_password, new_password_confirmation }` — minimal 8 karakter, berbeda dari current, confirmed cocok | **200 OK** — `message: "Password berhasil diperbarui."` | | |
| AUTH-30 | Negatif — Password lama salah | `PUT /api/me/password` | `current_password` tidak cocok dengan password user | **422 Unprocessable** — `message: "Password saat ini tidak sesuai."` | | |
| AUTH-31 | Negatif — Password baru sama dengan lama | `PUT /api/me/password` | `new_password` sama dengan `current_password` | **422 Unprocessable** — validasi `different:current_password` | | |
| AUTH-32 | Negatif — Password baru < 8 karakter | `PUT /api/me/password` | `new_password: "1234567"` | **422 Unprocessable** — validasi minimal 8 karakter | | |
| AUTH-33 | Negatif — Konfirmasi password tidak cocok | `PUT /api/me/password` | `new_password ≠ new_password_confirmation` | **422 Unprocessable** — validasi confirmed | | |
| AUTH-34 | Negatif — Tanpa token | `PUT /api/me/password` | Tanpa Authorization header | **401 Unauthorized** | | |

### 3.4 Logout

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-35 | Positif — Logout dengan token valid | `POST /api/logout` | Bearer token valid | **200 OK** — `message: "Logout berhasil"`, token dihapus dari database | | |
| AUTH-36 | Negatif — Logout tanpa token | `POST /api/logout` | Tanpa Authorization header | **401 Unauthorized** | | |

### 3.5 Email OTP

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| AUTH-37 | Positif — Kirim OTP verifikasi email | `POST /api/email-verification/send-otp` | User terautentikasi, `email_verified_at = null` | **200 OK** — `message: "OTP verifikasi berhasil dikirim ke email."` | | |
| AUTH-38 | Negatif — Email sudah terverifikasi | `POST /api/email-verification/send-otp` | User dengan `email_verified_at ≠ null` | **422 Unprocessable** — `message: "Email sudah terverifikasi."` | | |
| AUTH-39 | Negatif — Rate limit (3× dalam 60 detik) | `POST /api/email-verification/send-otp` | Kirim 4 request berturut-turut | **429 Too Many Requests** — `message: "Terlalu banyak permintaan OTP. Coba lagi nanti."` | | |
| AUTH-40 | Negatif — Resend terlalu cepat (< 60 detik dari OTP sebelumnya) | `POST /api/email-verification/send-otp` | OTP sebelumnya belum 60 detik dari `last_sent_at` | **429 Too Many Requests** — `message: "Tunggu 60 detik sebelum meminta OTP baru."` | | |
| AUTH-41 | Positif — Verifikasi OTP kode benar | `POST /api/email-verification/verify-otp` | `{ code: "123456" }` — 6 digit, cocok dengan hash di DB, belum expired | **200 OK** — `message: "Email berhasil diverifikasi."`, `user` dengan `email_verified_at` terisi | | |
| AUTH-42 | Negatif — Kode OTP salah | `POST /api/email-verification/verify-otp` | `code: "000000"` — tidak cocok | **422 Unprocessable** — `message: "Kode OTP tidak valid."` | | |
| AUTH-43 | Negatif — OTP kadaluarsa (> 10 menit) | `POST /api/email-verification/verify-otp` | OTP dengan `expires_at` sudah lewat | **422 Unprocessable** — `message: "OTP sudah kedaluwarsa. Silakan minta kode baru."` | | |
| AUTH-44 | Negatif — OTP tidak ditemukan | `POST /api/email-verification/verify-otp` | Tidak ada OTP aktif untuk user | **404 Not Found** — `message: "OTP tidak ditemukan. Silakan minta kode baru."` | | |
| AUTH-45 | Negatif — Terlalu banyak percobaan (≥ 5×) | `POST /api/email-verification/verify-otp` | OTP dengan `attempt_count ≥ 5` | **429 Too Many Requests** — `message: "Terlalu banyak percobaan. Silakan minta kode baru."` | | |
| AUTH-46 | Negatif — Tanpa token | `POST /api/email-verification/verify-otp` | Tanpa Authorization header | **401 Unauthorized** | | |
| AUTH-47 | Negatif — Format kode bukan 6 digit | `POST /api/email-verification/verify-otp` | `code: "12345"` (5 digit) | **422 Unprocessable** — validasi `digits:6` | | |

---

## 4. Store / Katalog (Publik)

### 4.1 Best Products

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| STR-01 | Positif — Ambil produk terlaris | `GET /api/store/best-products` | Data order dan produk tersedia; opsional `?limit=8` | **200 OK** — JSON array produk terlaris (maks. 8 item default) | | |
| STR-02 | Positif — Limit kustom | `GET /api/store/best-products?limit=4` | — | **200 OK** — JSON array maks. 4 item | | |

### 4.2 Homepage Media

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| STR-03 | Positif — Ambil media homepage | `GET /api/store/homepage-media` | Data `promotion_media` ada (atau kosong) | **200 OK** — `{ hero_desktop, hero_mobile, promo }` (masing-masing objek atau null) | | |

### 4.3 Categories

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| CAT-01 | Positif — List semua kategori | `GET /api/categories` | Ada data kategori | **200 OK** — JSON array kategori | | |
| CAT-02 | Positif — Detail kategori | `GET /api/categories/{id}` | Kategori dengan ID valid | **200 OK** — JSON objek kategori tunggal | | |
| CAT-03 | Negatif — Kategori tidak ditemukan | `GET /api/categories/99999` | ID tidak ada di database | **404 Not Found** | | |
| CAT-04 | Positif — Tambah kategori (admin/cashier/owner) | `POST /api/categories` | `{ name: "Kategori Baru" }` — role admin/owner/cashier | **201 Created** — JSON objek kategori baru | | |
| CAT-05 | Negatif — Tambah kategori tanpa nama | `POST /api/categories` | `name: ""` | **422 Unprocessable** — validasi required | | |
| CAT-06 | Positif — Update kategori | `PUT /api/categories/{id}` | `{ name: "Nama Baru" }` — role admin/owner/cashier | **200 OK** — JSON objek kategori terupdate | | |
| CAT-07 | Positif — Hapus kategori | `DELETE /api/categories/{id}` | Role admin/owner/cashier | **204 No Content** | | |
| CAT-08 | Negatif — Akses tanpa role | `POST /api/categories` | Tanpa role admin/owner/cashier | **401/403** | | |

### 4.4 Products

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| PRD-01 | Positif — List semua produk | `GET /api/products` | Ada data produk | **200 OK** — JSON array produk dengan relasi kategori & gambar | | |
| PRD-02 | Positif — Detail produk | `GET /api/products/{id}` | Produk dengan ID valid | **200 OK** — `{ success: true, data: { produk + kategori + gambar } }` | | |
| PRD-03 | Negatif — Produk tidak ditemukan | `GET /api/products/99999` | ID tidak ada | **404 Not Found** | | |
| PRD-04 | Positif — Tambah produk | `POST /api/products` | `{ category_id, name, base_price, images[] }` — role admin/owner/cashier | **201 Created** — `{ success: true, message: "Produk berhasil ditambahkan.", product }` | | |
| PRD-05 | Negatif — Tambah produk tanpa kategori | `POST /api/products` | `category_id` tidak diisi | **422 Unprocessable** | | |
| PRD-06 | Negatif — base_price negatif | `POST /api/products` | `base_price: -5000` | **422 Unprocessable** — validasi `min:0` | | |
| PRD-07 | Positif — Update produk | `PUT /api/products/{id}` | Role admin/owner/cashier, semua field valid | **200 OK** — produk terupdate | | |
| PRD-08 | Negatif — Update produk tanpa otorisasi | `PUT /api/products/{id}` | Role tidak memenuhi policy `update` | **403 Forbidden** | | |
| PRD-09 | Positif — Hapus produk | `DELETE /api/products/{id}` | Role memenuhi policy `delete` | **200 OK** — `{ message: "Produk berhasil dihapus" }` | | |
| PRD-10 | Negatif — Hapus produk tanpa otorisasi | `DELETE /api/products/{id}` | Role tidak memenuhi policy | **403 Forbidden** | | |

### 4.5 Catalog Products (Tampilan Store)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| PRD-11 | Positif — List katalog produk aktif | `GET /api/catalog-products` | Ada produk dengan `is_active = true` | **200 OK** — JSON array produk aktif dengan varian, harga, review, metrik penjualan | | |
| PRD-12 | Positif — Detail katalog produk | `GET /api/catalog-products/{id}` | Produk dengan `is_active = true` | **200 OK** — Detail produk lengkap (varian, harga, review, sales) | | |
| PRD-13 | Negatif — Produk non-aktif di katalog | `GET /api/catalog-products/{id}` | Produk dengan `is_active = false` | **404 Not Found** — `message: "Produk tidak ditemukan."` | | |

### 4.6 Product Variants

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| VAR-01 | Positif — List varian | `GET /api/product-variants` | Ada data varian | **200 OK** — JSON array varian dengan relasi produk | | |
| VAR-02 | Positif — Tambah varian | `POST /api/product-variants` | `{ product_id, sku, price, color?, size? }` — role admin/owner/cashier | **201 Created** — `message: "Varian produk berhasil ditambahkan"`, data varian | | |
| VAR-03 | Negatif — SKU duplikat | `POST /api/product-variants` | SKU yang sudah ada di database | **422 Unprocessable** — validasi `unique:product_variants,sku` | | |
| VAR-04 | Negatif — Harga negatif | `POST /api/product-variants` | `price: -1000` | **422 Unprocessable** — validasi `min:0` | | |
| VAR-05 | Positif — Update varian | `PUT /api/product-variants/{id}` | Role admin/owner/cashier | **200 OK** — `message: "Varian produk berhasil diupdate"` | | |
| VAR-06 | Positif — Hapus varian | `DELETE /api/product-variants/{id}` | Role admin/owner/cashier | **200 OK** — `message: "Varian produk berhasil dihapus"` | | |

### 4.7 Inventories

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| INV-01 | Positif — List inventory | `GET /api/inventories` | Ada data inventory | **200 OK** — JSON array inventory dengan relasi varian & produk | | |
| INV-02 | Positif — Tambah inventory | `POST /api/inventories` | `{ product_variant_id, stock_on_hand, stock_reserved?, min_stock_alert? }` — role admin/owner/cashier | **201 Created** — `message: "Inventory berhasil ditambahkan"` | | |
| INV-03 | Negatif — Variant ID sudah punya inventory | `POST /api/inventories` | `product_variant_id` yang sudah ada inventory-nya | **422 Unprocessable** — validasi `unique:inventories,product_variant_id` | | |
| INV-04 | Negatif — Stock negatif | `POST /api/inventories` | `stock_on_hand: -1` | **422 Unprocessable** — validasi `min:0` | | |
| INV-05 | Positif — Update inventory | `PUT /api/inventories/{id}` | Role admin/owner/cashier | **200 OK** — `message: "Inventory berhasil diupdate"` | | |
| INV-06 | Positif — Hapus inventory | `DELETE /api/inventories/{id}` | Role admin/owner/cashier | **200 OK** — `message: "Inventory berhasil dihapus"` | | |

---

## 5. Checkout / Shipping / Payment

### 5.1 Orders (Public)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| ORD-01 | Positif — Buat order lengkap (J&T) | `POST /api/orders` | `{ customer_name, email, phone, address, city, postal_code, shipping_method: "jnt", shipping_service_code, shipping_cost, payment_method, items: [{ product_variant_id, qty }] }` | **201 Created** — order baru dibuat dengan item dan status `pending` | | |
| ORD-02 | Positif — Buat order pickup | `POST /api/orders` | `shipping_method: "pickup"`, `shipping_cost: 0` | **201 Created** — order pickup tanpa shipping cost | | |
| ORD-03 | Negatif — J&T tanpa service code | `POST /api/orders` | `shipping_method: "jnt"` tanpa `shipping_service_code` | **422 Unprocessable** — `message: "Silakan pilih layanan pengiriman J&T terlebih dahulu."` | | |
| ORD-04 | Negatif — Items kosong | `POST /api/orders` | `items: []` | **422 Unprocessable** — validasi `min:1` | | |
| ORD-05 | Negatif — Stok tidak mencukupi | `POST /api/orders` | `qty` melebihi `stock_on_hand - stock_reserved` | **422 Unprocessable** — `message: "Stok produk tidak mencukupi."` | | |
| ORD-06 | Negatif — Product variant tidak valid | `POST /api/orders` | `product_variant_id` tidak ada di database | **422 Unprocessable** — validasi `exists:product_variants,id` | | |
| ORD-07 | Negatif — Field wajib kosong (customer_name, email, dll.) | `POST /api/orders` | Salah satu field required tidak diisi | **422 Unprocessable** — validasi required | | |

### 5.2 Shipping Rates

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| SHP-01 | Positif — Cek ongkir Biteship | `POST /api/shipping/rates` | `{ destination_postal_code, items: [{ product_name, qty, price, weight }] }` — postal code valid, items minimal 1 | **200 OK** — `message: "Berhasil mengambil ongkir."`, `options` array layanan | | |
| SHP-02 | Negatif — Items kosong | `POST /api/shipping/rates` | `items: []` | **422 Unprocessable** — validasi `min:1` | | |
| SHP-03 | Negatif — Postal code kosong | `POST /api/shipping/rates` | Tanpa `destination_postal_code` | **422 Unprocessable** — validasi required | | |
| SHP-04 | Negatif — API Biteship error | `POST /api/shipping/rates` | Postal code tidak dikenal Biteship | **422 Unprocessable** — `message: "Gagal mengambil data ongkir dari Biteship."` | | |

### 5.3 Payment

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| PAY-01 | Positif — Buat Snap token Midtrans | `POST /api/orders/{id}/payment-token` | Order dengan status `pending` dan `payment_status: "unpaid"` | **200 OK** — `{ snap_token, client_key, order_id, order_code }` | | |
| PAY-02 | Negatif — Order sudah dibayar | `POST /api/orders/{id}/payment-token` | Order dengan `payment_status: "paid"` | **422 Unprocessable** — `message: "Order ini sudah dibayar."` | | |
| PAY-03 | Negatif — Order tidak ditemukan | `POST /api/orders/99999/payment-token` | ID tidak ada | **404 Not Found** | | |
| PAY-04 | Positif — Callback Midtrans sukses | `POST /api/orders/midtrans-callback` | Payload valid dengan signature SHA512 cocok | **200 OK** — `message: "OK"` | | |
| PAY-05 | Negatif — Callback signature tidak valid | `POST /api/orders/midtrans-callback` | Payload dengan signature hash yang salah | **403 Forbidden** — `message: "Signature tidak valid."` | | |
| PAY-06 | Negatif — Callback payload tidak valid | `POST /api/orders/midtrans-callback` | Payload tanpa order_id atau tidak sesuai | **400 Bad Request** — `message: "Payload tidak valid."` | | |

### 5.4 Pay at Store (Bayar di Toko)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| PAY-07 | Positif — Detail order bayar di toko | `GET /api/orders/{id}/pay-at-store-detail` | Role admin/owner/cashier, order dengan `payment_method: "pay_at_store"` | **200 OK** — `{ success: true, data: order }` | | |
| PAY-08 | Negatif — Order bukan bayar di toko | `GET /api/orders/{id}/pay-at-store-detail` | Order dengan payment_method lain | **404 Not Found** | | |
| PAY-09 | Positif — Konfirmasi pembayaran di toko (cash) | `POST /api/orders/{id}/confirm-store-payment` | `{ pos_payment_method: "cash", cashier_staff_id }` — ada shift aktif, kasir aktif, order unpaid | **200 OK** — `message: "Pembayaran di toko berhasil dikonfirmasi."` | | |
| PAY-10 | Negatif — Transfer BCA tanpa referensi | `POST /api/orders/{id}/confirm-store-payment` | `pos_payment_method: "transfer_bca"` tanpa `transfer_ref` | **422 Unprocessable** — `message: "Nomor referensi transfer BCA wajib diisi."` | | |
| PAY-11 | Negatif — Tidak ada shift aktif | `POST /api/orders/{id}/confirm-store-payment` | Tidak ada `pos_shifts` dengan `closed_at = null` untuk user | **422 Unprocessable** — `message: "Tidak ada shift kasir yang sedang berjalan untuk user ini."` | | |
| PAY-12 | Negatif — Order sudah dibayar | `POST /api/orders/{id}/confirm-store-payment` | Order dengan `payment_status: "paid"` | **422 Unprocessable** — `message: "Order ini sudah dibayar."` | | |
| PAY-13 | Negatif — Order sudah dibatalkan | `POST /api/orders/{id}/confirm-store-payment` | Order dengan status `cancelled` | **422 Unprocessable** — `message: "Order sudah dibatalkan."` | | |
| PAY-14 | Positif — List order pending bayar di toko | `GET /api/pos/pending-store-orders` | Role admin/owner/cashier | **200 OK** — `{ success: true, data: [orders] }` | | |

---

## 6. Customer (Role: customer)

### 6.1 My Orders

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| CUS-01 | Positif — List pesanan sendiri | `GET /api/my-orders` | User login sebagai customer | **200 OK** — `{ data: [orders milik user] }` | | |
| CUS-02 | Negatif — Tanpa login | `GET /api/my-orders` | Tanpa token Bearer | **401 Unauthorized** | | |
| CUS-03 | Positif — Detail pesanan sendiri | `GET /api/orders/{id}` | ID order milik user login | **200 OK** — detail order dengan item dan review | | |
| CUS-04 | Negatif — Lihat pesanan milik user lain | `GET /api/orders/{id}` | ID order milik customer lain | **403 Forbidden** — policy `view` gagal | | |
| CUS-05 | Positif — Tracking pesanan J&T | `GET /api/orders/{id}/tracking` | Order milik user dengan `shipping_method: "jnt"` | **200 OK** — data tracking dari Biteship | | |
| CUS-06 | Negatif — Tracking pesanan pickup | `GET /api/orders/{id}/tracking` | Order dengan `shipping_method: "pickup"` | **200 OK** — `tracking: null` | | |
| CUS-07 | Positif — Konfirmasi pesanan diterima | `POST /api/orders/{id}/confirm-received` | Order milik user, status `shipped` | **200 OK** — `message: "Pesanan berhasil dikonfirmasi diterima."` | | |
| CUS-08 | Negatif — Konfirmasi sebelum shipped | `POST /api/orders/{id}/confirm-received` | Order masih `pending` atau `processing` | **422 Unprocessable** — `message: "Pesanan belum dapat dikonfirmasi diterima."` | | |
| CUS-09 | Negatif — Konfirmasi order yang sudah completed | `POST /api/orders/{id}/confirm-received` | Order sudah `completed` | **422 Unprocessable** — `message: "Pesanan ini sudah dikonfirmasi selesai."` | | |

### 6.2 Reviews (Customer)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| REV-01 | Positif — Review order yang sudah completed | `POST /api/orders/{id}/reviews` | `{ reviews: [{ order_item_id, rating: 5, comment }] }` — order completed milik user | **200 OK** — `message: "Ulasan berhasil disimpan."` | | |
| REV-02 | Negatif — Review order belum completed | `POST /api/orders/{id}/reviews` | Order masih `shipped` | **422 Unprocessable** — `message: "Review hanya bisa diberikan setelah pesanan selesai."` | | |
| REV-03 | Negatif — Item review tidak valid | `POST /api/orders/{id}/reviews` | `order_item_id` bukan dari order terkait | **422 Unprocessable** — `message: "Ada item review yang tidak valid untuk order ini."` | | |
| REV-04 | Negatif — Rating di luar 1-5 | `POST /api/orders/{id}/reviews` | `rating: 6` | **422 Unprocessable** — validasi `max:5` | | |
| REV-05 | Positif — List review sendiri | `GET /api/my-reviews` | Customer login | **200 OK** — `{ reviews: [...] }` | | |
| REV-06 | Positif — Lihat review order tertentu | `GET /api/orders/{id}/reviews` | Order milik user login | **200 OK** — `{ reviews: [...] }` | | |
| REV-07 | Negatif — Lihat review order milik orang lain | `GET /api/orders/{id}/reviews` | Order milik customer lain | **403 Forbidden** — `message: "Unauthorized"` | | |
| REV-08 | Positif — List review suatu produk (publik) | `GET /api/products/{id}/reviews` | Produk dengan ID valid (tidak perlu login) | **200 OK** — `{ reviews: [...] }` | | |

---

## 7. POS (Role: admin/owner/cashier)

### 7.1 Orders Management (Admin/Cashier)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| ORD-08 | Positif — List semua order (admin) | `GET /api/orders` | Role admin/owner/cashier | **200 OK** — list semua order | | |
| ORD-09 | Positif — Update status order | `PUT /api/orders/{id}/status` | `{ status: "processing" }` — role admin/owner/cashier, status valid | **200 OK** — `message: "Status order berhasil diperbarui."` | | |
| ORD-10 | Negatif — Status tidak valid | `PUT /api/orders/{id}/status` | `status: "invalid_status"` | **422 Unprocessable** — validasi `in:pending,processing,shipped,completed,cancelled` | | |
| ORD-11 | Negatif — Ubah status final (completed/cancelled) | `PUT /api/orders/{id}/status` | Order sudah completed/cancelled | **422 Unprocessable** — `message: "Status final tidak dapat diubah."` | | |
| ORD-12 | Positif — Summary order | `GET /api/orders-summary` | Opsional `?date_from=&date_to=` | **200 OK** — statistik summary order | | |

### 7.2 Cashier Staff (POS - Read)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| POS-01 | Positif — List kasir aktif untuk POS | `GET /api/pos/cashier-staff` | Role admin/owner/cashier | **200 OK** — `{ success: true, data: [kasir aktif] }` | | |

### 7.3 Shifts

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| POS-02 | Positif — Cek shift aktif | `GET /api/pos/shifts/active` | User login; mungkin ada shift aktif atau null | **200 OK** — `{ success: true, data: shift_object | null }` | | |
| POS-03 | Positif — Buka shift baru | `POST /api/pos/shifts/open` | `{ cashier_staff_id, opening_cash, notes? }` — tidak ada shift yang sudah terbuka | **201 Created** — `message: "Shift dibuka! Selamat bekerja, [nama]!"` | | |
| POS-04 | Negatif — Masih ada shift belum ditutup | `POST /api/pos/shifts/open` | User sudah punya shift dengan `closed_at = null` | **422 Unprocessable** — `message: "Masih ada shift yang belum ditutup."` | | |
| POS-05 | Negatif — Kasir tidak aktif | `POST /api/pos/shifts/open` | `cashier_staff_id` dengan `is_active = false` | **422 Unprocessable** — `message: "Kasir ini tidak aktif."` | | |
| POS-06 | Negatif — opening_cash negatif | `POST /api/pos/shifts/open` | `opening_cash: -5000` | **422 Unprocessable** — validasi `min:0` | | |
| POS-07 | Positif — Tutup shift | `POST /api/pos/shifts/close` | `{ shift_id, closing_cash, notes? }` — shift milik user, masih terbuka | **200 OK** — `{ success: true, data: { shift, total_transaksi, total_revenue, cash_difference, ... } }` | | |
| POS-08 | Negatif — Tutup shift yang sudah ditutup | `POST /api/pos/shifts/close` | `shift_id` dengan `closed_at ≠ null` | **404 Not Found** (tidak ditemukan karena filter `whereNull('closed_at')`) | | |
| POS-09 | Negatif — Tutup shift milik user lain | `POST /api/pos/shifts/close` | Shift milik user berbeda | **404 Not Found** | | |
| POS-10 | Positif — Riwayat shift | `GET /api/pos/shifts` | User login | **200 OK** — paginated shifts (10 per halaman) | | |

### 7.4 POS Transactions

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| POS-11 | Positif — Cari produk untuk POS | `GET /api/pos/products/search?q=keyword` | Role admin/owner/cashier | **200 OK** — `{ success: true, data: [variants] }` | | |
| POS-12 | Negatif — Query terlalu pendek | `GET /api/pos/products/search?q=a` | Kurang dari 2 karakter | **200 OK** — `{ success: true, data: [] }` | | |
| POS-13 | Positif — Buat transaksi tunai | `POST /api/pos/transactions` | `{ pos_shift_id, cashier_staff_id, payment_method: "cash", cash_received (≥ total), items: [{ product_variant_id, qty }] }` — shift aktif, kasir aktif | **201 Created** — `message: "Transaksi berhasil!"` + detail transaksi | | |
| POS-14 | Negatif — Uang diterima kurang | `POST /api/pos/transactions` | `payment_method: "cash"` dan `cash_received < grand_total` | **422 Unprocessable** — `message: "Uang yang diterima kurang dari total belanja."` | | |
| POS-15 | Negatif — Cash tanpa cash_received | `POST /api/pos/transactions` | `payment_method: "cash"` tanpa `cash_received` | **422 Unprocessable** — `message: "Jumlah uang yang diterima wajib diisi."` | | |
| POS-16 | Negatif — Transfer BCA tanpa referensi | `POST /api/pos/transactions` | `payment_method: "transfer_bca"` tanpa `transfer_ref` | **422 Unprocessable** — `message: "Nomor referensi transfer BCA wajib diisi."` | | |
| POS-17 | Negatif — Stok tidak mencukupi | `POST /api/pos/transactions` | `qty > stock_on_hand` | **422 Unprocessable** — message exception stok | | |
| POS-18 | Positif — List transaksi | `GET /api/pos/transactions?shift_id=X` | Role admin/owner/cashier | **200 OK** — `{ success: true, data: [transactions] }` | | |
| POS-19 | Positif — Detail transaksi | `GET /api/pos/transactions/{id}` | ID transaksi valid | **200 OK** — `{ success: true, data: transaction }` | | |
| POS-20 | Positif — Refund transaksi | `POST /api/pos/transactions/{id}/refund` | `{ pos_shift_id, cashier_staff_id, restock_items? }` — transaksi belum pernah direfund, shift aktif | **200 OK** — `message: "Refund berhasil dicatat."` | | |
| POS-21 | Negatif — Double refund | `POST /api/pos/transactions/{id}/refund` | Transaksi yang sudah direfund | **422 Unprocessable** — `message: "Transaksi ini sudah pernah direfund."` | | |

---

## 8. Admin (Role: admin/owner)

### 8.1 Cashier Staff Management

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| ADM-01 | Positif — List semua kasir (admin) | `GET /api/admin/cashier-staff` | Role admin/owner; opsional `?search=&is_active=` | **200 OK** — `{ success: true, data: [staff] }` | | |
| ADM-02 | Positif — Tambah kasir | `POST /api/admin/cashier-staff` | `{ name, code, is_active?, notes? }` — code unik | **201 Created** — `message: "Karyawan kasir berhasil ditambahkan."` | | |
| ADM-03 | Negatif — Code duplikat | `POST /api/admin/cashier-staff` | `code` sudah terpakai | **422 Unprocessable** — validasi `unique:cashier_staff,code` | | |
| ADM-04 | Positif — Detail kasir | `GET /api/admin/cashier-staff/{id}` | ID valid | **200 OK** — detail staff | | |
| ADM-05 | Positif — Update kasir | `PUT /api/admin/cashier-staff/{id}` | `{ name, code, is_active, notes? }` | **200 OK** — `message: "Karyawan kasir berhasil diperbarui."` | | |
| ADM-06 | Positif — Hapus kasir | `DELETE /api/admin/cashier-staff/{id}` | Kasir tidak punya shift berjalan | **200 OK** — `message: "Karyawan kasir berhasil dihapus."` | | |
| ADM-07 | Negatif — Hapus kasir yang punya shift berjalan | `DELETE /api/admin/cashier-staff/{id}` | Kasir punya `pos_shifts` dengan `closed_at = null` | **422 Unprocessable** — `message: "Kasir masih memiliki shift yang sedang berjalan."` | | |
| ADM-08 | Positif — Summary kasir | `GET /api/admin/cashier-staff/summary` | — | **200 OK** — `{ total_staff, active_staff, inactive_staff, open_shift_count, ... }` | | |
| ADM-09 | Positif — Shift history kasir | `GET /api/admin/cashier-staff/{id}/shifts` | Opsional `?status=` | **200 OK** — list shift kasir terkait | | |
| ADM-10 | Positif — Transaksi kasir | `GET /api/admin/cashier-staff/{id}/transactions` | Opsional `?status=&payment_method=` | **200 OK** — list transaksi kasir terkait | | |

### 8.2 Promotion Media

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| ADM-11 | Positif — List media promosi | `GET /api/admin/promotion-media` | Role admin/owner | **200 OK** — array PromotionMedia | | |
| ADM-12 | Positif — Upload media promosi | `POST /api/admin/promotion-media` | `{ title?, placement: "hero_desktop"|"hero_mobile"|"promo", image }` (multipart) | **201 Created** — `message: "Media berhasil di-upload dan langsung diaktifkan."` | | |
| ADM-13 | Negatif — Tanpa file gambar | `POST /api/admin/promotion-media` | Tanpa file `image` di request | **422 Unprocessable** — `message: "File gambar tidak ditemukan."` | | |
| ADM-14 | Negatif — Placement tidak valid | `POST /api/admin/promotion-media` | `placement: "invalid"` | **422 Unprocessable** — validasi `in:hero_desktop,hero_mobile,promo` | | |
| ADM-15 | Positif — Aktifkan media | `POST /api/admin/promotion-media/{id}/activate` | `{ type: "hero_desktop" }` | **200 OK** — `message: "Media berhasil diatur sebagai hero_desktop."` | | |
| ADM-16 | Negatif — Type tidak valid | `POST /api/admin/promotion-media/{id}/activate` | `type: "invalid"` | **422 Unprocessable** — validasi `in:hero_desktop,hero_mobile,promo` | | |
| ADM-17 | Positif — Hapus media | `DELETE /api/admin/promotion-media/{id}` | Media dengan ID valid | **200 OK** — `message: "Media berhasil dihapus."` | | |
| ADM-18 | Negatif — Hapus media tidak ditemukan | `DELETE /api/admin/promotion-media/99999` | ID tidak ada | **404 Not Found** — `message: "Media tidak ditemukan."` | | |

### 8.3 Admin Dashboard & Reports

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| ADM-19 | Positif — Dashboard admin | `GET /api/admin/dashboard` | Role admin/owner/cashier | **200 OK** — `{ message: "Dashboard admin" }` | | |
| ADM-20 | Positif — POS Summary | `GET /api/admin/pos-summary?date_from=&date_to=` | Role admin/owner/cashier | **200 OK** — `{ period, pos_totals, active_shift, daily_transactions }` | | |
| ADM-21 | Positif — Top Products | `GET /api/admin/top-products?date_from=&date_to=` | Role admin/owner/cashier | **200 OK** — JSON array produk teratas | | |
| ADM-22 | Positif — Admin Reports | `GET /api/admin/reports?date_from=&date_to=` | Role admin/owner/cashier | **200 OK** — `{ summary, top_products, status_summary, last_shifts, transactions }` | | |
| ADM-23 | Positif — Admin shifts index | `GET /api/admin/pos/shifts?cashier_staff_id=&status=&date=` | Role admin/owner | **200 OK** — paginated shifts (20/halaman) | | |
| ADM-24 | Positif — Admin pending store orders | `GET /api/admin/orders/pay-at-store-pending` | Role admin/owner | **200 OK** — list order pending bayar di toko | | |

---

## 9. Reports — Export (Role: admin only)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| RPT-01 | Positif — Laporan order (JSON) | `GET /api/reports/orders?from=&to=&status=&payment_status=` | Role admin | **200 OK** — paginated orders + filter | | |
| RPT-02 | Positif — Export orders Excel | `GET /api/reports/orders/export/excel` | Role admin | **200 OK** — file download `.xlsx` | | |
| RPT-03 | Positif — Export orders PDF | `GET /api/reports/orders/export/pdf` | Role admin | **200 OK** — file download `.pdf` | | |
| RPT-04 | Positif — Export semua data Excel | `GET /api/reports/all/export/excel` | Role admin | **200 OK** — file download `.xlsx` | | |
| RPT-05 | Positif — Export semua data PDF | `GET /api/reports/all/export/pdf` | Role admin | **200 OK** — file download `.pdf` | | |
| RPT-06 | Negatif — Akses report tanpa role admin | `GET /api/reports/orders` | Role selain admin | **401/403** | | |

---

## 10. Customer Home (Role: customer)

| ID | Skenario | Metode & Endpoint | Prekondisi / Input | Hasil Diharapkan | Hasil Aktual | Status |
|----|----------|-------------------|---------------------|------------------|--------------|--------|
| CUS-10 | Positif — Customer home | `GET /api/customer/home` | Login sebagai customer | **200 OK** — `{ message: "Selamat datang customer" }` | | |

---

## Ringkasan Statistik

| Modul | Jumlah Test Case | Positif | Negatif |
|-------|------------------|---------|---------|
| 1. Health Check | 1 | 1 | — |
| 2. Auth Publik (Register, Login, Forgot/Reset) | 21 | 6 | 15 |
| 3. Auth Terproteksi (Me, Profil, Password, Logout, OTP) | 26 | 10 | 16 |
| 4. Store/Katalog | 30 | 17 | 13 |
| 5. Checkout/Shipping/Payment | 20 | 8 | 12 |
| 6. Customer (Orders, Reviews) | 17 | 8 | 9 |
| 7. POS (Shifts, Transactions, Pay at Store) | 21 | 11 | 10 |
| 8. Admin (Cashier Staff, Media, Dashboard, Reports) | 24 | 16 | 8 |
| 9. Reports Export | 6 | 5 | 1 |
| 10. Customer Home | 1 | 1 | — |
| **TOTAL** | **167** | **83** | **84** |

> **Catatan Pengisian:**
> 1. Kolom **Hasil Aktual** diisi dengan response aktual yang diterima dari server saat pengujian (payload JSON atau pesan error).
> 2. Kolom **Status** diisi dengan ✅ **Pass** jika hasil aktual sesuai dengan hasil diharapkan, atau ❌ **Fail** jika tidak sesuai.
> 3. Gunakan Postman, cURL, atau automated test runner (PHPUnit) untuk menjalankan pengujian.
> 4. Untuk endpoint terproteksi, pastikan sudah mendapatkan Bearer token dari endpoint login/register terlebih dahulu.
> 5. Untuk pengujian rate-limit, jalankan request secara berurutan dalam waktu singkat (dalam 60 detik).
