
const getSessionToken = async () => {
    const sessionToken = localStorage.getItem("sessionToken");
    if (!sessionToken) {
        throw new Error("Session token not found");
    }
    return sessionToken;
}

const fetchWithAuth = async (url: string, options: any) => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
        throw new Error("NEXT_PUBLIC_API_URL is not set");
    }
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
        throw new Error("Session token not found");
    }
    const response = await fetch(`${base.replace(/\/$/, "")}${url}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json"
        }
    })
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        return { status: false, message: errorBody.message || "Failed to fetch data" };
    }
    return response.json();
}

export const getOptimizerHistory = async () => await fetchWithAuth("/job-histories", { method: "GET" });
export const getDashboardInfoApi = async () =>
    await fetchWithAuth("/bulk/get-dashboard-info", { method: "GET" });
export const getCruiseControlHistory = async () =>
    await fetchWithAuth("/webhook-histories", { method: "GET" });
export const saveTemplate = async (payload : any) => 
    await fetchWithAuth("/bulk/save-templates", { method: "POST", body: JSON.stringify(payload) });
export const updateCruiseControl = async (payload : any) => 
    await fetchWithAuth("/bulk/cruise-control", { method: "POST", body: JSON.stringify(payload) });
export const createOrderApi = async (amount: string) => 
    await fetchWithAuth("/payment/create-order", { method: "POST", body: JSON.stringify({ amount }) });
export const captureOrderApi = async (orderID: string) => 
    await fetchWithAuth("/payment/capture-order", { method: "POST", body: JSON.stringify({ orderID }) });
export const getRestoreItemsList = async (payload : any) => 
    await fetchWithAuth("/restore/getItems", { method: "POST", body: JSON.stringify(payload) });
export const restoreItemsApi = async (payload : any) => 
    await fetchWithAuth("/restore/restore-items", { method: "POST", body: JSON.stringify(payload) });
export const bulkRestoreApi = async (jobId: string) => 
    await fetchWithAuth("/restore/bulk-restore", { method: "POST", body: JSON.stringify({ jobId }) });
export const getRestoreJobsApi = async () => 
    await fetchWithAuth("/restore/getRestoreJobs", { method: "POST" });
export const updateBulkApi = async (payload : any) => 
    await fetchWithAuth("/bulk/update", { method: "POST", body: JSON.stringify(payload) });