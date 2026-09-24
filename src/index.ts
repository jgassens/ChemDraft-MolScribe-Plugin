/**
 * @chemdraft/plugin-molscribe-ocsr — public surface.
 *
 * The plugin owns no recognition engine. MolScribe is installed and run by the host and reached through
 * `recognition.recognizeStructure`, so everything here is the command flow, the review tier, and the
 * warnings the reviewer sees.
 */
export {
  molscribeOcsrManifest,
  molscribeOcsrPluginId,
  molscribeOcsrCommandId,
  molscribeOcsrPanelId,
  molscribeOcsrRecognizerId
} from "./manifest";

export {
  RECOGNITION_CONFIDENCE_THRESHOLDS,
  recognitionConfidenceTier,
  recognitionReviewWarnings
} from "./review";

export {
  createMolScribeOcsrCommandHandler,
  createMolScribeOcsrRegistration,
  type MolScribeOcsrPluginRegistration
} from "./register";
