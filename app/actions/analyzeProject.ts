/**
 * Server action: lightweight placeholder analysis.
 * Kept for compatibility; construction-library dependencies were removed from active schema.
 */

export type AnalyzeProjectInput = {
  slabArea: number;
  slabThickness: number;
  buildingType: string;
  region: string;
};

export type AnalyzeProjectResult = {
  volume: number;
  weight: number;
  compliant: boolean | null;
  codeReference?: string;
  estimatedSteel?: number;
};

export async function analyzeProject(projectData: AnalyzeProjectInput): Promise<AnalyzeProjectResult> {
  const { slabArea, slabThickness } = projectData;

  const volume = slabArea * (slabThickness / 1000);
  const densityKgM3 = 2400; // fallback constant retained for this compatibility helper
  const weight = volume * densityKgM3;
  const compliant = null;

  return {
    volume,
    weight,
    compliant,
    codeReference: undefined,
    estimatedSteel: undefined,
  };
}
