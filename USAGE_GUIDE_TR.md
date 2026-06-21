# Special Callouts — Kullanim Kilavuzu

Special Callouts ile ilgili bilmeniz gereken her sey. Temel stillemeden Dataview entegrasyonlu gelismis dashboard duzenlerine kadar.

---

## Icerik

- [Temel Sozdizimi](#temel-sozdizimi)
- [Renkler ve Arka Planlar](#renkler-ve-arka-planlar)
- [Tipografi](#tipografi)
- [Kenarliklar ve Sekiller](#kenarliklar-ve-sekiller)
- [Gorsel Efektler](#gorsel-efektler)
- [Metin Okunabilirlik Kenarliklari](#metin-okunabilirlik-kenarliklari)
- [Duzen: Ortala ve Kompakt](#duzen-ortala-ve-kompakt)
- [Cok Sutunlu Listeler](#cok-sutunlu-listeler)
- [Dataview Entegrasyonu](#dataview-entegrasyonu)
- [Grid Duzeni (Multi-Callout)](#grid-duzeni-multi-callout)
- [Ozel Stil Sablonlari](#ozel-stil-sablonlari)
- [Ayarlar Paneli](#ayarlar-paneli)
- [Komut Paleti](#komut-paleti)
- [Ipuclari](#ipuclari)
- [Sorun Giderme](#sorun-giderme)

---

## Temel Sozdizimi

Callout tipinin hemen arkasindan parantez `( )` icinde parametreler ekleyin:

```markdown
> [!note] (parametre1:deger1, parametre2:deger2) Basliginiz
> Icerik buraya...
```

**Temel kurallar:**
- Parametreler baslik metninden once `( )` icine yazilir
- Birden fazla parametre virgul `,` ile ayrilir
- Parametre adlari buyuk/kucuk harf duyarsizdir
- Adlandirilmis renkler (`red`, `blue`) veya hex kodlari (`#ff0000`) kullanilabilir

**En basit ornek:**
```markdown
> [!note] (bg:blue, text:white) Merhaba Dunya
> Bu mavi arka planli, beyaz yazili bir callout.
```

---

## Renkler ve Arka Planlar

### Arka Plan Rengi — `bg:`

```markdown
> [!note] (bg:red) Adlandirilmis Renk
> Onceden tanimli bir renk adi kullaniliyor.

> [!note] (bg:#2ecc71) Hex Renk
> Hex renk kodu kullaniliyor.
```

**Kullanilabilir adlandirilmis renkler:**
| Ad | Hex |
|------|-----|
| `red` | `#e74c3c` |
| `blue` | `#3498db` |
| `green` | `#2ecc71` |
| `yellow` | `#f1c40f` |
| `orange` | `#e67e22` |
| `purple` | `#9b59b6` |
| `pink` | `#e84393` |
| `teal` | `#1abc9c` |
| `grey`/`gray` | `#95a5a6` |

> Kendi ozel renk adlarinizi **Ayarlar → Renkler → Ozel Renkler** bolumunden tanimlayabilirsiniz.

### Yazi Rengi — `text:`

```markdown
> [!note] (bg:#2c3e50, text:#ecf0f1) Koyu Arka Plan
> Koyu arka planlarda okunabilirlik icin acik yazi.
```

### Baslik Rengi — `title:`

```markdown
> [!note] (bg:#1a1a2e, title:#e94560, text:#eee) Ozel Baslik
> Baslik kirmizi, icerik metni acik gri.
```

### Baglanti Rengi — `link:`

```markdown
> [!note] (bg:#2c3e50, text:white, link:orange) Baglantilar
> [[Sayfam]] veya [Google](https://google.com) — baglantilar turuncu gorunur.
```

### Degrade Arka Plan — `gradient:`

Iki rengi tire `-` ile ayirin:

```markdown
> [!tip] (gradient:blue-purple, text:white) Maviden Mora
> Yumusak degrade arka plan.

> [!tip] (gradient:#667eea-#764ba2, text:white) Hex Degrade
> Hassas renkler icin hex kodu kullanimi.

> [!tip] (gradient:#11998e-#38ef7d, text:white) Yesil Degrade
> Taze yesil tonlari.
```

---

## Tipografi

### Yazi Tipi Ailesi — `font:`

| Deger | Stil | En Iyi Kullanim |
|-------|------|-----------------|
| `mono` | `Monospace` | Kod, terminal, veri |
| `serif` | `Serif` | Resmi metin, makaleler |
| `sans` | `Sans-serif` | Temiz, modern gorunum |
| `hand` | `El yazisi` | Yapiskan notlar, gundelik |
| `marker` | `Kalin isaretci` | Basliklar, vurgulama |

```markdown
> [!note] (font:mono, bg:#0f0e17, text:#00ff41) Terminal
> $ npm install special-callouts
> $ echo "Hazir!"

> [!note] (font:hand, bg:#f1c40f, text:#2c3e50, no-icon) Yapiskan Not
> Sut almayi unutma!

> [!note] (font:serif, bg:#fdf2e9, text:#6c3483) Zarif
> Rafine, klasik serif gorunum.
```

### Yazi Boyutu — `font-size:`

`1` (en kucuk) ile `5` (en buyuk) arasinda olceklenir. Varsayilan `3`.

```markdown
> [!info] (font-size:1) Boyut 1 — Kucuk metin
> Dipnotlar veya ince baskiya uygun.

> [!info] (font-size:3) Boyut 3 — Varsayilan
> Normal okuma boyutu.

> [!info] (font-size:5) Boyut 5 — Buyuk metin
> Buyuk basliklar veya vurgulama icin.
```

---

## Kenarliklar ve Sekiller

### Kenarlik Rengi — `border:`

```markdown
> [!note] (border:red) Kirmizi Kenarlik
> Varsayilan sol kenarligi tam kirmizi kenarlikla degistirir.

> [!note] (border:none) Kenarlik Yok
> Tum kenarliklari tamamen kaldirir.
```

### Kenarlik Kalinligi — `border-width:`

Piksel cinsinden deger:
```markdown
> [!note] (border:#3498db, border-width:4) Kalin Kenarlik
> Tum kenarlarda 4px mavi kenarlik.
```

### Kenarlik Stili — `border-style:`

| Deger | Gorunum |
|-------|---------|
| `solid` | ── (varsayilan) |
| `dashed` | - - - |
| `dotted` | · · · |
| `double` | === |

```markdown
> [!warning] (border:#e74c3c, border-style:dashed, border-width:2) Kesikli
> Kesikli kirmizi kenarlik.

> [!note] (border:#3498db, border-style:dotted, border-width:2) Noktali
> Noktali mavi kenarlik.

> [!note] (border:#2ecc71, border-style:double, border-width:3) Cift
> Cift yesil kenarlik.
```

### Kose Yuvarlakligi — `radius:`

Piksel cinsinden deger (0 = keskin koseler, 30+ = hap sekli):

```markdown
> [!note] (radius:0, bg:#e74c3c, text:white) Keskin Koseler
> Hic yuvarlama yok.

> [!note] (radius:20, bg:#3498db, text:white) Yuvarlatilmis
> Guzel yuvarlatilmis koseler.

> [!note] (radius:50, bg:#9b59b6, text:white) Hap Sekli
> Kapsul gorunumu icin maksimum yuvarlama.
```

---

## Gorsel Efektler

### Neon Parlaklik — `neon:`

Renkli parlayan kenarlik + kutu golgesi ekler:

```markdown
> [!danger] (neon:#ff0000, bg:#1a0000, text:#ff6b6b) Kirmizi Neon
> Golgeli kirmizi parlayan kenarlik.

> [!info] (neon:#00f2ff, bg:#0a0a1a, text:#00f2ff) Cyan Neon
> Futuristik siber parlama.

> [!tip] (neon:#00ff88, bg:#001a0e, text:#00ff88) Yesil Neon
> Matrix tarzi yesil parlama.
```

> **Ipucu:** Neon koyu arka planlarda en iyi goruntulenir. Maksimum efekt icin koyu bir `bg:` rengi kullanin.

### Simgeyi Gizle — `no-icon`

```markdown
> [!note] (no-icon, bg:#f1c40f, text:black) Simge Yok
> Varsayilan callout simgesi gizlendi.
```

---

## Metin Okunabilirlik Kenarliklari

Yazi rengi arka plana yakin oldugunda, okunabilirlik icin metin kenarligi ekleyin:

### Temel Kullanim

```markdown
> [!note] (bg:#e74c3c, text:dark-border) Koyu Kenarlik
> Metin kirmizi uzerinde kontrast icin koyu dis hatta sahip.
```

### Gruplu Sozdizimi — Renk + Kenarlik Birlikte

Bir parametrede hem renk hem kenarlik ayarlamak icin parantez kullanin:

```markdown
> [!note] (bg:#e74c3c, text:(white, dark-border)) Gruplu
> Koyu kenarlikli beyaz metin — cok okunabilir!

> [!note] (bg:#2c3e50, text:(cyan, light-border)) Acik Kenarlik
> Koyu arka planda acik kenarlikli cyan metin.
```

### Tum Metin Ogeleri Icin Kullanilabilir

| Hedef | Parametre | Ornek |
|-------|-----------|-------|
| Icerik metni | `text:` | `text:(white, dark-border)` |
| Baslik | `title:` | `title:(yellow, dark-border)` |
| Baglantilar | `link:` | `link:(orange, light-border)` |

---

## Duzen: Ortala ve Kompakt

### Ortala — `center`

Hem basligi hem icerigi ortalar:

```markdown
> [!tip] (center, bg:#2ecc71, text:white) Ortali
> Her sey ortaya hizalanir.
> Alintilar, duyurular veya vurgu kutulari icin idealdir.
```

### Sadece Baslik Ortala — `title:center`

Sadece basligi ortalar, icerik sola hizali kalir:

```markdown
> [!quote] (title:center, bg:#2d3436, text:#dfe6e9, title:#74b9ff) Ortali Baslik
> Baslik ortali ama bu icerik normal akisinda.
> Resmi veya dokuman tarzi duzenler icin kullanisli.
```

### Kompakt — `compact`

Yogun, widget benzeri bir gorunum icin dolguyu azaltir:

```markdown
> [!info] (compact, bg:#3498db, text:white) Kompakt
> Minimum dolgu. Dashboard->lar icin ideal.

> [!warning] (compact, bg:#e67e22, text:white) Yogun Uyari
> Daha az dikey alan kaplar.
```

> **Dashboard ipucu:** Bilgi yogun panolar icin `compact` ile `multi-callout` grid->lerini birlestirin.

---

## Cok Sutunlu Listeler

`col:N` kullanarak madde isareti veya numarali listeleri gazete tarzi sutunlara bolun:

### Temel Kullanim

```markdown
> [!note] (col:2) Iki Sutun
> - Madde 1
> - Madde 2
> - Madde 3
> - Madde 4
> - Madde 5
```

Sonuc: Maddeler **yukaridan asagiya, sonra soldan saga** akar (gazete stili).
`col:2` ile 5 madde → Sutun 1: Madde 1,2,3 | Sutun 2: Madde 4,5

### Uc Sutun

```markdown
> [!note] (col:3, bg:#2c3e50, text:#ecf0f1) Teknoloji Yigini
> - React
> - Vue
> - Angular
> - Svelte
> - Next.js
> - Nuxt
> - Remix
> - Astro
> - SolidJS
```

### Gorevlerle

```markdown
> [!todo] (col:2, bg:#1a1a2e, text:#a29bfe) Proje Gorevleri
> - [x] Tasarim mockup
> - [x] Proje kurulumu
> - [ ] Frontend gelistirme
> - [ ] API entegrasyonu
> - [ ] Test
> - [ ] Dagitim
```

---

## Dataview Entegrasyonu

Special Callouts, [Dataview](https://github.com/blacksmithgu/obsidian-dataview) eklentisi ile sorunsuz calisir. Dinamik veri cekip cok sutunlu duzenlerde goruntuleyebilirsiniz.

### Dataview->dan Gorev Listeleri

Kasanizdan gorevleri cekip sutunlarda goruntuley:

````markdown
> [!todo] (col:2, bg:#1a1a2e, text:#a29bfe, title:#00cec9) Aktif Gorevler
> ```dataview
> TASK
> FROM "Projeler"
> WHERE !completed
> LIMIT 20
> ```
````

### Gruplu Listeler

Birden fazla kaynaktan liste cekin:

````markdown
> [!note] (col:3, bg:#2d3436, text:#dfe6e9) Okuma Listesi
> ```dataview
> LIST
> FROM #kitap AND #okunacak
> SORT file.name ASC
> ```
````

### Teknik Detaylar

- Sutun motoru guvenilir dagitim icin **CSS Grid** kullanir
- Bir **yeniden deneme mekanizmasi** (100ms → 2s, 5 deneme) Dataview icerigi asenkron yuklediginde bile sutunlarin calismasini saglar
- Bir **MutationObserver** dinamik olarak eklenen icerigi izler ve sutun duzenini yeniden uygular
- Desteklenenler: `ul`, `ol`, `.dataview`, `.block-language-dataview`, gruplu Dataview listeleri

> **Onemli:** Homepage eklentisi kullaniyorsaniz, yeniden deneme mekanizmasi ilk yuklemede bile sutunlarin ana sayfanizda calismisini saglar.

---

## Grid Duzeni (Multi-Callout)

`[!multi-callout]` sarmalayicisini kullanarak yan yana callout duzenleri olusturun.

### Temel 2 Sutunlu Grid

```markdown
> [!multi-callout]
> > [!info] (1:2) Sol Panel
> > Sol taraf icin icerik.
>
> > [!tip] (2:2) Sag Panel
> > Sag taraf icin icerik.
```

### 3 Sutunlu Grid

```markdown
> [!multi-callout]
> > [!info] (1:3, bg:#3498db, text:white) Istatistikler
> > Kullanicilar: 1.234
>
> > [!success] (2:3, bg:#2ecc71, text:white) Gelir
> > 12.345 TL
>
> > [!warning] (3:3, bg:#e67e22, text:white) Uyarilar
> > 3 beklemede
```

### Grid Sozdizimi

| Sozdizimi | Anlam |
|-----------|-------|
| `(1:2)` | 2 sutunun 1. pozisyonu (sol yari) |
| `(2:2)` | 2 sutunun 2. pozisyonu (sag yari) |
| `(1:3)` | 3 sutunun 1. pozisyonu (sol ucte bir) |
| `(2:3:2)` | Pozisyon 2, 3 sutun, satir 2 |

### Cok Satirli Dashboard

```markdown
> [!multi-callout]
> > [!note] (1:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#00f2ff, compact) CPU
> > Kullanim: %45
>
> > [!note] (2:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#ff6bcb, compact) RAM
> > Kullanim: 6.2 GB
>
> > [!note] (3:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#ffd93d, compact) Disk
> > Bos: 128 GB
```

### Mobil Uyumlu

600px->den kucuk ekranlarda grid sutunlari otomatik olarak dikey olarak yigilir.

---

## Ozel Stil Sablonlari

### Sablon Olusturma

1. **Ayarlar → Special Callouts** acin
2. **Ozel Callout->lar** bolumunde stilinizi yapilandirin:
   - Ad, simge, renkler, yazi tipleri, kenarliklar, efektler ayarlayin
   - Degisiklikleri anlik gormek icin **Canli Onizleme** kullanin
3. **Kaydet** tusuna basin

### Sablonlari Kullanma

**Yontem 1: Dogrudan callout tipi olarak**
```markdown
> [!ozel-stilim]
> Bu "ozel-stilim" sablonunu dogrudan kullaniyor.
```

**Yontem 2: Herhangi bir callout->a style parametresi ile**
```markdown
> [!note] (style:ozel-stilim) Basligim
> Herhangi bir standart callout tipine sablon uygulayabilirsiniz.
```

### Sablonlari Paylasma

- **Disa aktarma:** Ayarlardaki Disa Aktar butonuna tiklayin — JSON panoya kopyalanir
- **Ice aktarma:** Ice Aktar->a tiklayin ve JSON->i yapistin

---

## Ayarlar Paneli

Eklenti ayarlar panelinin dort ana bolumu vardir:

### 1. Hizli Islemler
Ustte iki buton:
- **Nasil Kullanilir** — Kullanim talimatlari modalini acar
- **Metadata Referansi** — Tam parametre referans modalini acar

### 2. Ozel Callout->lar
- **Hizli Baslangic Sablonlari:** Tek tikla sablonlar (Ocean Deep, Neon Glow, Forest, Sunset)
- **Rastgele:** Aninda benzersiz rastgele bir stil uretin
- **Canli Onizleme:** Duzenlerken callout->unuzu anlik gorun
- **Kimlik:** Stil adi + simge secici (bulanik aramayla)
- **Palet:** Arka plan, kenarlik, baslik, metin ve baglanti renkleri; hex girisleri ve renk secicileri
- **Efektler:** Renk secicili neon parlaklik gecisi
- **Tipografi:** Yazi tipi ailesi acilir menusu + yazi boyutu secici
- **Yapi:** Kenarlik stili, kalinlik kaydirici, kose yaricapi kaydirici
- **Duzen Modlari:** Kompakt mod gecisi, simge gizleme gecisi
- **Ice/Disa Aktarma:** Stilleri JSON olarak paylasin

### 3. Standart Callout->lar
Obsidian->in yerlesik callout tiplerinin (note, info, warning vb.) varsayilan gorunumunu degistirin:
- Grid veya Liste gorunumu
- Arka plan, baslik ve metin renklerini duzenlemek icin tiklayin
- Istediginiz zaman varsayilanlara sifirlayin

### 4. Renkler
- **Standart Renkler:** Adlandirilmis renklerin hex degerlerini duzenleyin (red, blue, green...)
- **Ozel Renkler:** Her yerde kullanmak uzere kendi adlandirilmis renklerinizi ekleyin (orn. `marka-mavi → #1a73e8`)

---

## Komut Paleti

`Ctrl/Cmd + P` tuslayip arama yapin:

| Komut | Aciklama |
|-------|----------|
| `Insert Custom Callout` | Tum kayitli ozel stilleri gozatip birini ekleyin |
| `Insert "[stil-adi]" callout` | Belirli bir ozel stili dogrudan ekleyin |
| `Show Metadata Reference` | Parametre referans modalini acin |

> Bu komutlardan herhangi birine **Ayarlar → Kisayol Tuslari → Special Callouts** bolumunden kisayol atayabilirsiniz.

---

## Ipuclari

### Birden Fazla Parametreyi Birlestirin
```markdown
> [!note] (bg:#0f0e17, text:#a7a9be, font:mono, neon:#ff6bcb, radius:12, compact, title:#ff6bcb) Tam Guc
> Ihtiyaciniz kadar parametre kullanin!
```

### Dataview Dashboard Deseni
````markdown
> [!multi-callout]
> > [!todo] (1:2, col:2, compact, bg:#1a1a2e, text:#dfe6e9) Gorevler
> > ```dataview
> > TASK FROM "Projeler" WHERE !completed LIMIT 10
> > ```
>
> > [!note] (2:2, col:2, compact, bg:#1a1a2e, text:#dfe6e9) Okuma
> > ```dataview
> > LIST FROM #kitap AND #okunacak LIMIT 10
> > ```
````

### Yapiskan Not Stili
```markdown
> [!note] (bg:#f1c40f, text:black, font:hand, radius:0, no-icon, compact)
> Hizli hatirlatma!
```

### Kod Terminali
```markdown
> [!note] (bg:#0f0e17, text:#00ff41, font:mono, border:none, title:#00ff41) ~/terminal
> $ git status
> $ git add .
> $ git commit -m "feat: yeni ozellik"
```

### Uyari Afisi
```markdown
> [!danger] (center, bg:#e74c3c, text:white, font-size:4, neon:#ff0000, radius:0) UYARI
> Bu islem geri alinamaz!
```

---

## Sorun Giderme

### Sutunlar sayfa yuklendiginde gorunmuyor
**Neden:** Dataview veya Homepage eklentisi icerigi asenkron yukluyor.
**Cozum:** Eklenti bir yeniden deneme mekanizmasi icerir (100ms->den 2s->ye 5 deneme). Sutunlar hala gorunmuyorsa farkli bir nota gecip geri donmeyi deneyin.

### Multi-callout grid Okuma Modunda calismiyor
**Cozum:** Bu sorun v1.0.1->de duzeltildi. En son surumu kullandiginizdan emin olun.

### Degrade + kenarlik sorunu
**Not:** `gradient:` kullanildiginda kenarlik otomatik olarak `none` ayarlanir. Bu gorsel bozulmalari onlemek icin tasarim geregi boyledir. Degradelerle kenarlik istiyorsaniz, degrade parametresinden sonra `border:renk` ekleyin.

### Ozel stil gorunmuyor
**Kontrol edin:**
1. Stil adi bosluk icermiyor (tire kullanin: `benim-stilim`)
2. Eklenti etkin
3. Ayarlar kaydedildi (Kaydet butonuna tiklayin)

---

## Katki ve Hata Bildirimi

Bu eklenti **acik kaynaktir**. Katkilar, hata bildirimleri ve ozellik istekleri memnuniyetle karsilanir.

- **Hata Bildirimi:** [GitHub->da sorun acin](https://github.com/ahseyg/special-callouts/issues)
- **Ozellik Istekleri:** Ayni baglanti — fikirlerinizi duymak isteriz!
- **Pull Request:** Repo->yu forkladiktan sonra degisikliklerinizi yapin ve PR gonderin

Hata bildirirken lutfen sunlari ekleyin:
1. Obsidian surumunuz
2. Soruna neden olan callout markdown->i
3. Mumkunse bir ekran goruntusu
4. Sorunun Duzenleme modunda mi, Okuma modunda mi yoksa her ikisinde mi oldugu
