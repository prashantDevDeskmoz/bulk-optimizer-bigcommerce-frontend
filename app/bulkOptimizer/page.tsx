import { fetchStoreInfoServer, getAllTemplates, getDashboardInfo } from "@/lib/fetchStoreInfo";
import BulkOptimizerClient from "./BulkOptimizerClient";

export default async function BulkOptimizerPage() {

  const [initialStoreInfo, allInitialTemplates, dashboardInfo] = await Promise.all([
    fetchStoreInfoServer(),
    getAllTemplates(),
    getDashboardInfo(),
  ]);

  console.log("dashboardInfo:::::::::::::::::::::::::::::::::::::", dashboardInfo);

  return (
  <>
    <BulkOptimizerClient
      initialStoreInfo={initialStoreInfo}
      allInitialTemplates={allInitialTemplates}
      dashboardInfo={dashboardInfo}
    />
  </>
);
}
