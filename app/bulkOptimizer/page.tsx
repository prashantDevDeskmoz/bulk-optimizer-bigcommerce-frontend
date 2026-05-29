import { fetchStoreInfoServer, getAllTemplates } from "@/lib/fetchStoreInfo";
import BulkOptimizerClient from "./BulkOptimizerClient";

export default async function BulkOptimizerPage() {

  const [initialStoreInfo, allInitialTemplates] = await Promise.all([
    fetchStoreInfoServer(),
    getAllTemplates(),
  ]);

  return (
  <>
    <BulkOptimizerClient
      initialStoreInfo={initialStoreInfo}
      allInitialTemplates={allInitialTemplates}
    />
  </>
);
}
