import type { PluginManifest } from "@chemdraft/plugin-api";

export const molscribeOcsrPluginId = "org.chemdraft.ocsr.molscribe";

export const molscribeOcsrCommandId = "plugin.molscribeOcsr.recognizeImage";
export const molscribeOcsrPanelId = "panel.molscribeOcsr.review";
export const molscribeOcsrRecognizerId = "recognizer.molscribeOcsr.image";

/**
 * `apiVersion` is `^0.1.6`, and the floor is deliberate: host-owned image acquisition
 * (`images.requestImage`) arrived in 0.1.5 and local structure recognition
 * (`recognition.recognizeStructure`) in 0.1.6. A 0.x caret locks the minor, so `^0.1.6` installs on
 * 0.1.6+ and is correctly REFUSED by anything older, where the plugin could not recognize anything.
 */
export const molscribeOcsrManifest: PluginManifest = {
  id: molscribeOcsrPluginId,
  name: "Structure from Image (MolScribe)",
  version: "0.1.0",
  apiVersion: "^0.1.6",
  description: "Local image-to-structure recognition with host-managed MolScribe and review before insertion.",
  entry: "dist/plugin.js",
  // Proposal-only: the result is queued through `document.proposePatch` for the user to accept or
  // reject. There is no `document.write`, and no `network.fetch` or `model.download` — the host owns
  // the engine install.
  permissions: [
    "image.read",
    "ml.inference",
    "model.load",
    "native.execute",
    "document.proposePatch",
    "ui.menu",
    "ui.panel"
  ],
  contributes: {
    commands: [
      {
        id: molscribeOcsrCommandId,
        title: "Recognize Structure from Image",
        category: "Tools",
        description: "Recognize a chemical structure from an image using the local MolScribe engine.",
        requiredPermissions: [
          "image.read",
          "ml.inference",
          "model.load",
          "native.execute",
          "document.proposePatch",
          "ui.panel"
        ],
        enabled: true
      }
    ],
    menus: [
      {
        id: "menu.molscribeOcsr.recognizeImage",
        title: "Recognize Structure from Image",
        commandId: molscribeOcsrCommandId,
        location: "analyze",
        requiredPermissions: ["ui.menu"]
      }
    ],
    panels: [
      {
        id: molscribeOcsrPanelId,
        title: "MolScribe OCSR",
        commandId: molscribeOcsrCommandId,
        requiredPermissions: ["ui.panel"]
      }
    ],
    toolbarButtons: [],
    toolsets: [],
    inspectors: [],
    templates: [],
    importers: [],
    exporters: [],
    analyzers: [],
    transformers: [],
    recognizers: [
      {
        id: molscribeOcsrRecognizerId,
        title: "MolScribe OCSR Image Recognizer",
        input: "selected-image",
        commandId: molscribeOcsrCommandId,
        requiredPermissions: ["image.read", "ml.inference", "model.load", "native.execute"]
      }
    ]
  }
};
