import { NextRequest, NextResponse } from "next/server";

const middleware = async (req: NextRequest) => {
    const { nextUrl } = req;

    if (nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/bulkOptimizer", req.url));
    }

    return NextResponse.next(); 
}

export const config = {
    matcher: [
        "/",
    ],
}

export default middleware;