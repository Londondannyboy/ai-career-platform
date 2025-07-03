import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * GET /api/debug/my-user-id
 * Get current user's Clerk ID and email for admin setup
 */
export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return Response.json({ 
        error: 'Not authenticated',
        message: 'Please log in to see your user ID' 
      }, { status: 401 });
    }

    const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);

    return Response.json({
      success: true,
      userInfo: {
        clerkUserId: userId,
        primaryEmail: primaryEmail?.emailAddress,
        allEmails: user.emailAddresses.map(email => email.emailAddress),
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: primaryEmail?.emailAddress === 'keegan.dan@gmail.com'
      },
      adminSetup: {
        message: 'Use this Clerk user ID to replace the placeholder in admin functions',
        clerkUserIdToUse: userId
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}