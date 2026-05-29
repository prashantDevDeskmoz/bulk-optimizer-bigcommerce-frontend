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
        console.log("errorBody333333333333333333333", errorBody);
        throw new Error(errorBody.error || "JWT verification failed");
    }
    const data = await response.json();
    return data;
}

export { loginWithPayloadJWT };
