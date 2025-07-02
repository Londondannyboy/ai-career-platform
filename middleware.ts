import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/api/public/(.*)',
  '/api/datamagnet-vanilla',
  '/api/datamagnet-company-vanilla',
  '/api/synthetic-hybrid-test',
  '/api/raw-test',
  '/datamagnet-vanilla',
  '/datamagnet-company-vanilla',
  '/synthetic-hybrid-test',
  '/api-status',
  '/datamagnet-insights',
  '/company-insights',
  '/graph-insights',
  '/api/workspace/create',
  '/api/workspace/list',
  '/api/test-db'
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    return;
  }
  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};