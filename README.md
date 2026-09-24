# Structure from Image (MolScribe)

A ChemDraft plugin that recognizes a chemical structure in an image. Run
**Analyze → Recognize Structure from Image**, choose an image file or capture a
region of the screen, and ChemDraft proposes the recognized structure for you to
review before anything is inserted.

Recognition is done by [MolScribe](https://github.com/thomas0809/MolScribe), an
image-to-graph model for molecular structures.

## What it does

**Recognition runs on this computer.** The image is never sent to a remote
service. The plugin has no `network.fetch` or `model.download` permission.

**The engine is downloaded on first use, after asking.** The first time you run
the command, ChemDraft offers to install a private Python, PyTorch and the
MolScribe model into your ChemDraft data folder (about **2.5 GB**). It shows the
space required and free, and download progress. Choose **Not now** and the
plugin's panel says recognition needs the engine and where to install it
(**Add or Remove Plugins**, which also shows the installed size and a
**Remove** action).

**Nothing is inserted without review.** The plugin only proposes; it does not
request `document.write`. The review shows the source image, a drawing of the
recognized structure, its SMILES, a confidence tier and any warnings. You accept
or reject it.

MolScribe's score is the model's own, not a calibrated probability, so it is
shown only as a tier:

| Tier | Score | For the reviewer |
|---|---|---|
| high | ≥ 0.85 | usually right; still look |
| medium | 0.65–0.85 | check every stereocentre, charge and label |
| low | < 0.65 | expect at least one wrong atom or bond |
| missing | none | reliability unknown |

### Warnings

Each appears only when the result gives a reason for it:

- **low confidence** — low tier, or any atom or bond scored below 0.65;
- **missing confidence data** — no overall, per-atom or (for more than one atom)
  per-bond scores;
- **stereochemistry uncertainty** — any stereo in the SMILES or molfile;
- **charge/radical uncertainty** — any charge or radical;
- **abbreviation/superatom uncertainty** — `*`, an R-group or abbreviation label,
  an alias, or a superatom group;
- **radicals or isotope labels not drawn** — kept in the structure data but not
  shown in the drawing;
- **invalid or unsanitized SMILES/MOL** — reported in the panel and never
  proposed.

## Requirements

ChemDraft with plugin API **0.1.6** or later (`apiVersion: ^0.1.6`). Image input
arrived in 0.1.5 and local recognition in 0.1.6; older hosts refuse to install
the plugin.

Permissions: `image.read`, `ml.inference`, `model.load`, `native.execute`,
`document.proposePatch`, `ui.menu`, `ui.panel`.

## Installation

Run `npm run package`, then in ChemDraft choose **Add plugin from package…** and
select `dist/plugin-packages/molscribe-ocsr-0.1.0.zip`. ChemDraft runs the
package in a module worker.

## Development

```bash
npm install
npm test        # vitest, including the command against the real PluginHost
npm run lint    # tsc --noEmit over src
npm run package # build the installable plugin zip
```

`tools/` holds vendored copies of ChemDraft's packaging scripts, run through
`tsx`; `vendor/` holds the ChemDraft plugin SDK 0.1.6.

## Licences

This plugin's code is MIT; see `LICENSE`.

The recognition engine is **not in the plugin zip**. ChemDraft downloads it into
your data folder on first use, after asking. Its parts carry their own licences:
MolScribe code (MIT), MolScribe model weights (MIT), PyTorch (BSD). If you use
MolScribe results in published work, cite the MolScribe paper as its authors
request.
