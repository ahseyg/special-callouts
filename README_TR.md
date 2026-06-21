<p align="center">
  <a href="https://community.obsidian.md/plugins/special-callouts"><img src="https://img.shields.io/badge/Obsidian-Kur-7c3aed?logo=obsidian&logoColor=white" alt="Obsidian'dan Kur"/></a>
  <img src="https://img.shields.io/github/stars/ahseyg/special-callouts?style=flat&color=3498db" alt="Yıldız"/>
  <img src="https://img.shields.io/github/issues/ahseyg/special-callouts?style=flat&color=e74c3c" alt="Sorunlar"/>
  <img src="https://img.shields.io/github/license/ahseyg/special-callouts?style=flat&color=2ecc71" alt="Lisans"/>
  <img src="https://img.shields.io/github/v/release/ahseyg/special-callouts?style=flat&color=f39c12" alt="Sürüm"/>
</p>

<p align="center">
  <a href="USAGE_GUIDE.md">Kullanım Kılavuzu</a> · <a href="README.md">English</a> · <a href="https://github.com/ahseyg/special-callouts/issues">Hata Bildir</a></p>

# Special Callouts — Obsidian Eklentisi

Obsidian notlarınızı premium, dinamik ve tamamen özelleştirilebilir callout'lara dönüştürün. Sıradan kutuları dergi kalitesinde düzenlere, kod terminallerine veya neon parlayan uyarılara çevirin. Her şeyi doğrudan markdown'ınızdan özelleştirin — veya görsel ayarlar panelinden yeniden kullanılabilir şablonlar oluşturun.

**Açık kaynak** · MIT Lisansı · Katkılara açık

---

## Özellikler

- **Satır içi özelleştirme** — arka plan, yazı, kenarlık, degrade, neon, simge — doğrudan markdown'da
- **Özel stil şablonları** — bir kere tasarla, adıyla kullan
- **Çok sütunlu listeler** — herhangi bir listeyi 2–4 sütuna böl
- **Görsel düzen oluşturucu** — sürükle-birleştir grid tasarımcısı
- **Tipografi kontrolü** — 5 yazı tipi ailesi, 5 boyut ölçeği
- **Neon ve degrade efektleri** — parlayan kenarlıklar, renk geçişleri
- **Dataview entegrasyonu** — sütun düzenleri Dataview sorguları ile çalışır
- **İçe/dışa aktarma** — JSON ile kasalar arası stil paylaşımı

---

## Hızlı Başlangıç

### Satır İçi Parametreler

Callout tipinin hemen arkasına parantez içinde parametreler ekleyin:

```markdown
> [!note] (bg:#2ecc71, text:white) Merhaba Dünya
> Yeşil arka planlı, beyaz yazılı bir callout.
```

### Özel Şablonlar

**Ayarlar → Special Callouts** bölümünden bir stil oluşturup adlandırın (örn. `terminal`), sonra her yerde kullanın:

```markdown
> [!terminal]
> Sistem hazır.
> Komut bekleniyor...
```

Veya standart callout'lara da uygulayabilirsiniz:

```markdown
> [!info] (style:terminal)
> Bu bilgi kutusu artık terminal gibi görünüyor.
```

---

## Ekran Görüntüleri

### Renkler, Degradeler ve Efektler

![Renkler ve Arka Planlar](assets/colors_backgrounds.png)

![Degradeler](assets/gradients.png)

![Neon Efektleri](assets/neon_glow_effects.png)

### Görsel Düzen Oluşturucu

Hücreleri sürükleyerek ve birleştirerek karmaşık dashboard grid'leri tasarlayın — kod gerekmez. **Ayarlar → Special Callouts → Visual Layout Builder** yolundan erişin.

![Görsel Oluşturucu Ayarları](assets/visual_builder_settings.png)

### Dashboard Grid'leri

Görsel oluşturucuyu veya satır içi grid söz dizimini kullanarak çok panelli düzenler oluşturun. Callout'lar tasarladığınız birleştirilmiş alanlara otomatik olarak yerleştirilir.

![Dashboard Grid](assets/ultimate_dashboard.png)

### Tipografi ve Kenarlıklar

![Tipografi ve Yazı Tipleri](assets/typography_fonts.png)

![Kenarlık Stilleri](assets/border_styles.png)

### Çok Sütunlu Listeler

![Standart Sütunlar](assets/standard_columns.png)

---

## Örnekler

### Degradeler

```markdown
> [!tip] (gradient:#667eea-#764ba2, text:white) Mor Degrade
> İki rengi tire ile ayırın.
```

### Çok Sütunlu

```markdown
> [!note] (col:3, bg:#2c3e50, text:#ecf0f1) Yetenekler
> - HTML     - TypeScript
> - CSS      - React
> - JS       - Node.js
```

### Grid Düzeni

```markdown
> [!multi-callout]
> > [!info] (1:2, bg:#3498db, text:white) Sol Panel
> > İçerik.
>
> > [!tip] (2:2, bg:#2ecc71, text:white) Sağ Panel
> > İçerik.
```

### Neon Parlaklık

```markdown
> [!danger] (neon:#ff0000, bg:#1a0000, text:#ff6b6b) Uyarı
> Parlayan kenarlık ve kutu gölgesi. Koyu arka planlarda en güzel görünür.
```

Tüm örnekler ve parametreler için [Kullanım Kılavuzu](USAGE_GUIDE.md)'na bakın.

---

## Metadata Referansı

`> [!tip] (parametre:değer, parametre2:değer2) Başlık`

### Renkler
| Parametre | Örnek | Açıklama |
| :--- | :--- | :--- |
| `bg` | `bg:#ff0000` | Arka plan rengi |
| `text` | `text:white` | İçerik yazı rengi |
| `title` | `title:cyan` | Başlık ve simge rengi |
| `link` | `link:orange` | Bağlantı rengi |
| `gradient` | `gradient:blue-purple` | İki renkli degrade |
| `neon` | `neon:#00f2ff` | Neon kenarlık + parlaklık |
| `icon` | `icon:sun` | Lucide simge adı |
| `no-icon` | `(no-icon)` | Simgeyi gizle |

### Kenarlıklar
| Parametre | Örnek | Açıklama |
| :--- | :--- | :--- |
| `border` | `border:red` | Kenarlık rengi |
| `border-width` | `border-width:4` | Kalınlık (px) |
| `border-style` | `border-style:dashed` | `solid`, `dashed`, `dotted`, `double` |
| `radius` | `radius:20` | Köşe yuvarlaklığı (px) |

### Tipografi
| Parametre | Örnek | Açıklama |
| :--- | :--- | :--- |
| `font` | `font:mono` | `mono`, `serif`, `sans`, `hand`, `marker` |
| `font-size` | `font-size:4` | `1` (küçük) → `5` (büyük) |

### Düzen
| Parametre | Örnek | Açıklama |
| :--- | :--- | :--- |
| `col` | `(col:3)` | Çok sütunlu listeler |
| `center` | `(center)` | İçeriği ortala |
| `compact` | `(compact)` | Dolguyu azalt |
| Grid | `(1:2)` | Grid pozisyonu |

Tam referans için [Kullanım Kılavuzu](USAGE_GUIDE.md)'na bakın.

---

## Kurulum

### Topluluk Eklentileri (Önerilen)

1. **Ayarlar → Topluluk Eklentileri**
2. Kısıtlı Modu kapatın
3. Gözat → **Special Callouts** arayın
4. Kur → Etkinleştir

Doğrudan açın: [community.obsidian.md/plugins/special-callouts](https://community.obsidian.md/plugins/special-callouts)

### Manuel

1. [Son sürümden](https://github.com/ahseyg/special-callouts/releases) `main.js`, `styles.css`, `manifest.json` indirin
2. `KasaKlasörü/.obsidian/plugins/special-callouts/` oluşturun
3. Dosyaları klasöre kopyalayın
4. Ayarlar → Topluluk Eklentileri'nden etkinleştirin

---

## Katkıda Bulunma

- **Hata bildirimi:** [Sorun açın](https://github.com/ahseyg/special-callouts/issues) — Obsidian sürümü, callout markdown'ı ve ekran görüntüsü ekleyin
- **Özellik isteği:** [Sorun açın](https://github.com/ahseyg/special-callouts/issues)
- **Pull request:** Fork → Branch → Kod → PR

Eklentiyi faydalı buluyorsanız bir [yıldız](https://github.com/ahseyg/special-callouts) bırakmayı düşünün.

---

## Lisans

MIT — Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---
<p align="center">
  Geliştirici: <a href="https://github.com/ahseyg">ahseyg</a>
</p>
