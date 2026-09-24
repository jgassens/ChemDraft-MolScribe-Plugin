import type { PluginCommandHandler, PluginPanelReport, PluginRecognitionResult } from "@chemdraft/plugin-api";

import { molscribeOcsrCommandId, molscribeOcsrPanelId } from "./manifest";
import { recognitionConfidenceTier, recognitionReviewWarnings } from "./review";

export interface MolScribeOcsrPluginRegistration {
  commandHandlers: Record<string, PluginCommandHandler>;
}

/**
 * The command: ask the host for an image, have the host's local MolScribe engine recognize that same
 * image, and queue the result as a proposal for the user to accept or reject. It never inserts
 * directly. Cancelling image acquisition is silent; every other stop explains itself in the panel.
 */
export function createMolScribeOcsrCommandHandler(): PluginCommandHandler<
  PluginRecognitionResult | { status: "cancelled" | "unavailable" }
> {
  return async (context) => {
    for (const permission of [
      "image.read",
      "ml.inference",
      "model.load",
      "native.execute",
      "document.proposePatch",
      "ui.panel"
    ] as const) {
      context.requirePermission(permission);
    }
    const imageResult = await context.images!.requestImage({
      title: "Recognize Structure from Image"
    });

    if (imageResult.status === "cancelled") return imageResult;
    if (imageResult.status === "unavailable") {
      await showMessage(context, `Image input is unavailable: ${imageResult.reason}`);
      return imageResult;
    }

    const recognition = await context.recognition!.recognizeStructure(imageResult.image);
    if (recognition.status === "engineNotInstalled") {
      await showMessage(context, "Recognition needs the local engine. Install it in Add or Remove Plugins.");
      return recognition;
    }
    if (recognition.status === "failed") {
      await showMessage(context, `Recognition failed: ${recognition.message}`);
      return recognition;
    }

    const result = recognition.result;
    if (!result.proposedMolfile || !result.proposedPatch) {
      await showMessage(
        context,
        "Recognition failed: the returned SMILES/MOL was invalid or unsanitized, so no insertion was proposed."
      );
      return {
        status: "failed",
        code: "invalidResult",
        message: "The returned SMILES/MOL was invalid or unsanitized."
      };
    }

    const confidenceTier = recognitionConfidenceTier(result.confidence);
    const warnings = recognitionReviewWarnings(result);
    await context.documents.proposePatch({
      ...result.proposedPatch,
      reason: `Insert the locally recognized structure (${confidenceTier} confidence) after review.`,
      warnings,
      requiresUserApproval: true,
      recognition: {
        sourceImageRef: result.sourceImageRef,
        proposedSmiles: result.proposedSmiles,
        proposedMolfile: result.proposedMolfile,
        confidenceTier,
        engine: result.engine,
        elapsedMs: result.elapsedMs
      }
    });
    return recognition;
  };
}

/** Build the registration for `host.registerPlugin`. */
export function createMolScribeOcsrRegistration(): MolScribeOcsrPluginRegistration {
  return { commandHandlers: { [molscribeOcsrCommandId]: createMolScribeOcsrCommandHandler() } };
}

async function showMessage(context: Parameters<PluginCommandHandler>[0], body: string): Promise<void> {
  const report: PluginPanelReport = {
    title: "MolScribe OCSR",
    sections: [{ kind: "text", body }]
  };
  await context.panels?.showReport(molscribeOcsrPanelId, report);
}
