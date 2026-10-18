# Fonts

`newsreader-roman.woff2` and `newsreader-italic.woff2` are subsets of **Newsreader** (Production Type,
SIL Open Font License 1.1, see `Newsreader-OFL.txt`), cut from `ofl/newsreader/Newsreader[opsz,wght].ttf`
in github.com/google/fonts.

They are rebuilt with fontTools to keep the files small without losing optical sizes:

```bash
fonttools varLib.instancer "Newsreader[opsz,wght].ttf" wght=400 opsz=20:72 -o inst.ttf
pyftsubset inst.ttf --flavor=woff2 --no-hinting --desubroutinize \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2009,U+200A,U+2010-2027,U+2030-203A,U+2044,U+20B9,U+20AC,U+2122,U+2190-2193,U+2212,U+2248,U+00D7" \
  --layout-features="kern,liga,clig,calt,ccmp,locl,mark,mkmk,lnum,tnum,case" \
  --output-file=newsreader-roman.woff2
```

Hanken Grotesk, IBM Plex Mono and Tiro Devanagari Hindi load through `next/font/google`.
