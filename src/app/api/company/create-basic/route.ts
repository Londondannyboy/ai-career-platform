import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, website, country } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: 'Company name and website are required' },
        { status: 400 }
      );
    }

    // Just create a basic company object - no database, no auth check
    const company = {
      id: Date.now().toString(),
      name: name.trim(),
      isValidated: true,
      validatedBy: 'manual' as const,
      location: country || undefined,
      domain: website.replace(/^https?:\/\//, ''),
      website: website.startsWith('http') ? website : `https://${website}`,
      logo: `https://www.google.com/s2/favicons?domain=${website.replace(/^https?:\/\//, '')}&sz=128`
    };

    // Return success immediately
    return NextResponse.json({
      company,
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Company creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}