import type {
  RecognitionConfidenceTier,
  RecognitionWarning,
  RecognizedStructureResult
} from "@chemdraft/plugin-api";

/**
 * Review-tier thresholds on MolScribe's own confidence score. The score is the model's product of
 * per-token probabilities, not a calibrated probability of being right, so it is shown only as a tier
 * (never as a percentage). The cut points are review guidance: at or above `high` the structure is
 * usually right but still needs a look; below `medium` expect at least one wrong atom or bond.
 */
export const RECOGNITION_CONFIDENCE_THRESHOLDS = { high: 0.85, medium: 0.65 } as const;

/** Confidence is an honest review tier, not a claimed calibrated probability. */
export function recognitionConfidenceTier(confidence: number | null): RecognitionConfidenceTier {
  if (confidence === null) return "missing";
  if (confidence >= RECOGNITION_CONFIDENCE_THRESHOLDS.high) return "high";
  if (confidence >= RECOGNITION_CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "low";
}

// Line shapes, not a molfile parser: each test asks one yes/no question of the text the engine
// returned. The host has already parsed and validated the structure before it reached the plugin.
const V2000_ATOM_LINE =
  /^\s*-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+(\S+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/;
const V2000_BOND_LINE = /^\s*\d+\s+\d+\s+\d+\s+(\d+)(?:\s|$)/;
const ABBREVIATION_LABELS =
  "R\\d*|R#|Ar|X|Ph|Me|Et|n?Pr|i-?Pr|n?Bu|t-?Bu|i-?Bu|s-?Bu|Ac|Bn|Bz|Boc|Cbz|Fmoc|Ts|Ms|Tf|TMS|TBS|TBDMS|TIPS|OMe|OEt|OAc|CO2Me|CO2Et|CF3|NO2";
const SMILES_ABBREVIATION = new RegExp(`\\*|\\[(?:${ABBREVIATION_LABELS})\\]`);
const MOLFILE_ABBREVIATION_SYMBOL = new RegExp(`^(?:${ABBREVIATION_LABELS}|A|Q|\\*)$`);

interface MolfileSignals {
  stereo: boolean;
  chargeOrRadical: boolean;
  abbreviation: boolean;
}

function molfileSignals(molfile: string): MolfileSignals {
  const signals: MolfileSignals = { stereo: false, chargeOrRadical: false, abbreviation: false };
  // The first three lines are the free-text header block; never read them as chemistry.
  for (const line of molfile.split(/\r?\n/).slice(3)) {
    if (/V2000|V3000/.test(line)) continue;
    if (/^M\s+(CHG|RAD)\b/.test(line) || /\b(CHG|RAD)=-?[1-9]/.test(line)) signals.chargeOrRadical = true;
    if (/\bCFG=[1-3]\b/.test(line)) signals.stereo = true;
    if (/^M\s+STY\b.*\bSUP\b/.test(line) || /^M\s+ALS\b/.test(line) || /^A\s+\d+/.test(line)) {
      signals.abbreviation = true;
    }
    if (/^M\s+V30\b/.test(line)) {
      if (/\bTYPE=SUP\b|\bSUP\b/.test(line)) signals.abbreviation = true;
      const v3000Atom = /^M\s+V30\s+\d+\s+(\S+)\s+-?\d/.exec(line);
      if (v3000Atom && MOLFILE_ABBREVIATION_SYMBOL.test(v3000Atom[1]!)) signals.abbreviation = true;
      continue;
    }
    const atom = V2000_ATOM_LINE.exec(line);
    if (atom) {
      if (MOLFILE_ABBREVIATION_SYMBOL.test(atom[1]!)) signals.abbreviation = true;
      if (atom[3] !== "0") signals.chargeOrRadical = true; // charge field; 4 is a doublet radical
      if (atom[4] !== "0") signals.stereo = true; // atom parity
      continue;
    }
    const bond = V2000_BOND_LINE.exec(line);
    if (bond && bond[1] !== "0") signals.stereo = true; // wedge 1, either 4, hash 6, cis/trans-either 3
  }
  return signals;
}

/** Warnings are derived from the returned chemistry, never invented fixture claims. */
export function recognitionReviewWarnings(result: RecognizedStructureResult): RecognitionWarning[] {
  const warnings = [...result.warnings];
  const add = (code: string, message: string): void => {
    if (!warnings.some((warning) => warning.code === code)) warnings.push({ code, message });
  };
  const tier = recognitionConfidenceTier(result.confidence);
  const lowAtoms = result.atomConfidence.filter(
    (point) => point.confidence < RECOGNITION_CONFIDENCE_THRESHOLDS.medium
  ).length;
  const lowBonds = result.bondConfidence.filter(
    (point) => point.confidence < RECOGNITION_CONFIDENCE_THRESHOLDS.medium
  ).length;
  if (tier === "low") {
    add("recognition.low-confidence", "Recognition confidence is low; inspect every atom and bond before insertion.");
  } else if (lowAtoms + lowBonds > 0) {
    add(
      "recognition.low-confidence",
      `${count(lowAtoms, "atom")} and ${count(lowBonds, "bond")} were recognized with low confidence; inspect them before insertion.`
    );
  }
  // A single atom has no bonds, so an empty bond list is only missing data when there are several atoms.
  if (tier === "missing" || result.atomConfidence.length === 0 || (result.atomConfidence.length > 1 && result.bondConfidence.length === 0)) {
    add("recognition.missing-confidence", "Confidence data is missing for some or all of the recognized structure.");
  }

  const smiles = result.proposedSmiles ?? "";
  const signals = molfileSignals(result.proposedMolfile ?? "");
  if (signals.stereo || /[@/\\]/.test(smiles)) {
    add("recognition.stereochemistry-uncertain", "Stereochemistry was recognized from the image and must be reviewed.");
  }
  if (signals.chargeOrRadical || /\[[^\]]*[+-][^\]]*\]/.test(smiles)) {
    add("recognition.charge-radical-uncertain", "Charges or radicals were recognized from the image and must be reviewed.");
  }
  if (signals.abbreviation || SMILES_ABBREVIATION.test(smiles)) {
    add(
      "recognition.abbreviation-superatom-uncertain",
      "An abbreviation or superatom may be present; confirm that it was interpreted correctly."
    );
  }
  return warnings;
}

function count(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}
