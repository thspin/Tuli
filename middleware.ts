import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disabled Clerk middleware for debugging
// TODO: Re-enable once Clerk keys are properly configured
export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
