---
name: recompress-pdf
description: "Shrink oversized PDFs (e.g. course/news flyers) by recompressing embedded images with Ghostscript, without visible loss of print quality. Use when a PDF to be published under kurse/ or news/ is unexpectedly large."
argument-hint: "path to the source PDF"
---

# Recompress PDF Images

Course and news flyers are often exported from Word/Canva at far higher image
resolution than print needs, bloating the PDF to several MB. This skill
diagnoses which embedded images are oversized and recompresses them with
Ghostscript, typically reducing file size by 90%+ with no visible quality loss.

## 1. Diagnose

List embedded images with their effective resolution (`x-ppi`/`y-ppi`):

```bash
pdfimages -list source.pdf
```

Print only needs ~300–400 ppi (600 ppi for very fine detail). Any image
reported well above that — commonly a logo/QR-code placed small on the page
but embedded at full photo resolution — is the main contributor to file size.
Cross-check with `ls -la` / `du -h` to confirm which images dominate the total.

## 2. Recompress

```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/prepress \
   -dDownsampleColorImages=true -dColorImageResolution=400 -dColorImageDownsampleType=/Bicubic \
   -dDownsampleGrayImages=true -dGrayImageResolution=400 -dGrayImageDownsampleType=/Bicubic \
   -dDownsampleMonoImages=true -dMonoImageResolution=800 \
   -dAutoFilterColorImages=false -dColorImageFilter=/DCTEncode -dJPEGQ=92 \
   -dAutoFilterGrayImages=false -dGrayImageFilter=/DCTEncode \
   -dNOPAUSE -dBATCH -dQUIET \
   -sOutputFile=recompressed.pdf \
   source.pdf
```

- `ColorImageResolution` / `GrayImageResolution`: **400** ppi — good print quality with a large size win over 300 ppi at negligible extra cost.
- `JPEGQ`: **92** — visually lossless at this resolution; drop to 85 if size still matters more than quality.
- `MonoImageResolution`: 800 ppi — mono (1-bit) images are cheap; keep this high so text-like line art stays sharp.
- `-dPDFSETTINGS=/prepress` is the base preset (keeps color spaces / fonts intact); the explicit `Downsample*`/`JPEGQ` flags override its default 300 ppi/quality.

Re-run `pdfimages -list recompressed.pdf` to confirm the oversized image(s) now report ~400 ppi.

## 3. Verify quality

Never trust the numbers alone — render both versions and view them:

```bash
pdftoppm -png -r 150 source.pdf orig
pdftoppm -png -r 150 recompressed.pdf recomp
```

Then use the image viewer tool on `recomp-1.png` (compare to `orig-1.png` if in
doubt) and check fine details (QR codes, small text) are still legible.

## 4. Generate/update the preview JPEG

Course and news article previews follow a fixed **283×400** portrait convention
(see [kurse/README.md](../../../kurse/README.md), [news/README.md](../../../news/README.md)):

```bash
pdftoppm -jpeg -scale-to-x 283 -scale-to-y 400 recompressed.pdf preview
```

## 5. Publish

Copy the recompressed PDF and generated preview into the article folder,
replacing the originals, using the existing naming convention:

- `<slug>.pdf`
- `<slug>_preview.jpg`

No other files need regenerating — `zjv-articles.js` reads `articles.jsonl` and
renders `article.md` client-side, so there is no per-article `index.html` to
rebuild.
