import { molscribeOcsrManifest } from "./manifest";
import { createMolScribeOcsrRegistration } from "./register";

/** The pure worker wiring; kept separate so it can be verified without starting a Worker runtime. */
export const molscribeOcsrWorkerRegistration = {
  manifest: molscribeOcsrManifest,
  commandHandlers: createMolScribeOcsrRegistration().commandHandlers
};
