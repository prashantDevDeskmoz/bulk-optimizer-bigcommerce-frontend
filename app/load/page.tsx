import { Suspense } from "react";
import LoadClient from "./LoadClient";

export default async function LoadPage({ searchParams }: { searchParams: any }) {

  // const {signed_payload , signed_payload_jwt} = await searchParams;

  // const verifyAndRedirect = async () => {
  //   try {
  //     const response = await loginWithPayloadJWT(signed_payload_jwt || signed_payload || "");
  //     if(typeof window !== "undefined"){
  //       localStorage.setItem("sessionToken", response.sessionToken);
  //     }
  //     dispatchSessionReady();
  //     // router.push("/bulkOptimizer");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
  // verifyAndRedirect();


  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            <p>Loading your app...</p>
          </div>
        </div>
      }
    >
      <LoadClient />
    </Suspense>
  );
}

// function getAuthCookieOptions(req) {
//   const forwardedProto = req.get("x-forwarded-proto");
//   const isHttpsRequest =
//     req.secure || (forwardedProto && forwardedProto.includes("https"));
//   const isSecureCookie =
//     process.env.ENVIRONMENT === "production" || Boolean(isHttpsRequest);
//   const cookieOptions = {
//     httpOnly: true,
//     sameSite: isSecureCookie ? "none" : "lax",
//     secure: isSecureCookie,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     path: "/",
//     domain : ".shares.zrok.io"
//   };
//   if (process.env.AUTH_COOKIE_DOMAIN) {
//     cookieOptions.domain = process.env.AUTH_COOKIE_DOMAIN;
//   }
//   return cookieOptions;
// }