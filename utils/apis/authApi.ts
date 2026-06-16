const loginWithPayloadJWT = async (signed_payload_jwt: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-jwt`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ signed_payload_jwt }),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.log("errorBody", errorBody);
        throw new Error(errorBody.message || "JWT verification failed");
    }
    const data = await response.json();
    return data;
}

export { loginWithPayloadJWT };
