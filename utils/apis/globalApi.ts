const getSessionToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("sessionToken");
}

const fetchWithAuth = async (url: string, options: any) => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
        throw new Error("NEXT_PUBLIC_API_URL is not set");
    }
    const sessionToken = getSessionToken();
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
        throw new Error("Failed to fetch data");
    }
    return response.json();
}

export const getOptimizerHistory = async () => await fetchWithAuth("/job-histories", { method: "GET" });
export const getCruiseControlHistory = async () =>
    await fetchWithAuth("/webhook-histories", { method: "GET" });
export const saveTemplate = async (payload : any) => 
    await fetchWithAuth("/bulk/save-templates", { method: "POST", body: JSON.stringify(payload) });
export const updateCruiseControl = async (payload : any) => 
    await fetchWithAuth("/bulk/cruise-control", { method: "POST", body: JSON.stringify(payload) });