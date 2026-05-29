import { Suspense } from "react";
import InstallClient from "./InstallClient";

export default function InstallPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <InstallClient />
    </Suspense>
  );
}
