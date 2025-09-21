import type { UserData, PoliticalSpectrumScores } from "@/store/useStore";
import { supabase } from "./supabaseClient";

const mapSpectrum = (row: any): PoliticalSpectrumScores | undefined => {
  if (!row) return undefined;
  return {
    economic: typeof row.economic === "number" ? row.economic : 0,
    social: typeof row.social === "number" ? row.social : 0,
    foreignPolicy: typeof row.foreign_policy === "number" ? row.foreign_policy : 0,
    governance: typeof row.governance === "number" ? row.governance : 0,
    cultural: typeof row.cultural === "number" ? row.cultural : 0,
  };
};

export const getPoliticalLabel = (score: number) => {
  if (score < -30) return "Very Liberal";
  if (score < -10) return "Liberal";
  if (score < 10) return "Moderate";
  if (score < 30) return "Conservative";
  return "Very Conservative";
};

export const mapProfileRowToUserData = (
  row: any,
  fallback?: Partial<UserData>
): UserData => {
  const privateData = Array.isArray(row?.private_user_data)
    ? row.private_user_data[0]
    : row?.private_user_data;
  const spectrumRow = Array.isArray(row?.political_spectrum)
    ? row.political_spectrum[0]
    : row?.political_spectrum;

  const spectrum = mapSpectrum(spectrumRow);
  const overallAffiliation = typeof row?.overall_affiliation === "number"
    ? row.overall_affiliation
    : fallback?.overall_affiliation ?? null;

  const signupDate = fallback?.signupDate || new Date().toISOString();

  return {
    fullName: row?.full_name ?? fallback?.fullName ?? "",
    username: row?.username ?? fallback?.username ?? "",
    email: privateData?.email ?? fallback?.email ?? "",
    age: typeof privateData?.age === "number" ? privateData.age : fallback?.age ?? null,
    quizCompleted: Boolean(spectrum) || fallback?.quizCompleted || false,
    quizResults: spectrum
      ? {
          spectrum,
          completedAt: spectrumRow?.updated_at ?? fallback?.quizResults?.completedAt,
        }
      : fallback?.quizResults,
    signupDate,
    overall_affiliation: overallAffiliation,
    politicalLean:
      overallAffiliation !== null && overallAffiliation !== undefined
        ? getPoliticalLabel(overallAffiliation)
        : fallback?.politicalLean ?? null,
  };
};

export const fetchUserProfile = async (userId: string, fallback?: Partial<UserData>): Promise<UserData | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      overall_affiliation,
      private_user_data (email, age),
      political_spectrum (economic, social, foreign_policy, governance, cultural, updated_at)
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRowToUserData(data, fallback);
};
