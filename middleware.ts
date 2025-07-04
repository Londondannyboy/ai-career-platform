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
  '/api/debug/(.*)',
  '/api/test-db',
  '/api/test-workspaces',
  '/api/debug-user',
  '/api/test/apollo',
  '/api/test/apollo-debug',
  '/api/test/apollo-simple',
  '/api/enrich/company',
  '/api/enrich/company-smart',
  '/api/enrich/companies',
  '/api/enrich/cleanup-duplicates',
  '/api/intelligence/company',
  '/api/intelligence/search-suggestions',
  '/api/demo/(.*)'
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