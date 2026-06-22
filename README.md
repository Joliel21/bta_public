# BTA Public

Public, reader-facing content source for **Breathtaking Awareness / The Words We Carry**.

## Source of truth

The master content/control file is:

```text
public/content/issue.json
```

Figma/source apps and WordPress reader plugins should fetch this file from:

```text
https://raw.githubusercontent.com/Joliel21/bta_public/main/public/content/issue.json
```

## Rule

This repo owns public magazine content only:
- issue metadata
- cover/back-cover/topbar context
- front matter page definitions
- chapter definitions
- article metadata and markdown
- ad/back-matter definitions
- public images/fonts/share pages

It should not contain private plugin source code.
