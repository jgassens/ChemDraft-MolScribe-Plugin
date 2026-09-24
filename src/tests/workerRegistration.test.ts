import { describe, expect, it } from "vitest";

import { molscribeOcsrManifest } from "../manifest";
import { molscribeOcsrWorkerRegistration } from "../workerRegistration";

describe("the worker registration", () => {
  it("carries the manifest the package ships", () => {
    expect(molscribeOcsrWorkerRegistration.manifest).toBe(molscribeOcsrManifest);
  });

  it("has a handler for every command the manifest contributes", () => {
    const contributedCommandIds = molscribeOcsrManifest.contributes.commands?.map(({ id }) => id).sort();
    expect(Object.keys(molscribeOcsrWorkerRegistration.commandHandlers).sort()).toEqual(contributedCommandIds);
  });
});
