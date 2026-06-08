import { requireUser } from "@/lib/dal";
import { getMonthlySpending } from "@/lib/analytics-view";
import { SpendAnalysis } from "@/components/spend-analysis";

export default async function AnalysisPage() {
  const user = await requireUser();
  const months = await getMonthlySpending(user.id);
  return <SpendAnalysis months={months} />;
}
