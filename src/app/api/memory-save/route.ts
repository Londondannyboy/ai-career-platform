import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// In-memory storage (resets on deploy)
const memoryStore: Record<string, any> = {};
const companyStore: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { type, data } = await request.json();
    
    if (type === 'surface-repo') {
      // Save to memory
      memoryStore[userId] = data;
      return NextResponse.json({ success: true, message: 'Saved successfully' });
    }
    
    if (type === 'company') {
      const { name, website, country } = data;
      const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname;
      
      // Check if exists
      const existing = Object.values(companyStore).find((c: any) => c.domain === domain);
      if (existing) {
        return NextResponse.json({ 
          success: true, 
          company: existing
        });
      }

      // Create new
      const company = {
        id: Date.now().toString(),
        name,
        domain,
        website: website.startsWith('http') ? website : `https://${website}`,
        logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        location: country,
        isValidated: true
      };
      
      companyStore[company.id] = company;
      
      return NextResponse.json({ 
        success: true, 
        company
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    
    if (type === 'surface-repo') {
      return NextResponse.json({ 
        success: true, 
        data: memoryStore[userId] || {} 
      });
    }
    
    if (type === 'companies') {
      const query = request.nextUrl.searchParams.get('q') || '';
      const companies = Object.values(companyStore)
        .filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10);
      
      return NextResponse.json({ 
        success: true, 
        companies
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}