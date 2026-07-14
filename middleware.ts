import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Explicitly allow the landing page, Clerk's internal auth/callback links, and webhooks
const isPublicRoute = createRouteMatcher([
  '/', 
  '/api/auth(.*)', 
  '/api/webhooks(.*)',
  '/sign-in(.*)', 
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  // 2. Protect any route that isn't explicitly marked as public
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};