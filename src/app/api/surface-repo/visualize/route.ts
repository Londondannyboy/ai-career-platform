import { NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

export async function GET() {
  try {
    const testUserId = 'test-user-123';

    // Get or create user profile
    const profile = await DeepRepoService.getUserProfile(testUserId);
    
    if (!profile) {
      // Create new profile with sample Surface Repo data
      await DeepRepoService.updateRepoLayer(testUserId, 'surface', {
        headline: "Founder & CEO at Quest",
        summary: "Building the future of professional identity through AI-powered networking. Passionate about transforming how professionals connect and grow.",
        experience: [
          {
            id: "exp1",
            title: "Founder & CEO",
            company: "Quest",
            startDate: "2024-01",
            current: true,
            description: "Leading the development of revolutionary professional networking platform"
          },
          {
            id: "exp2",
            title: "Senior Product Manager",
            company: "TechCorp",
            startDate: "2021-06",
            endDate: "2023-12",
            description: "Led AI product initiatives"
          }
        ],
        skills: ["AI", "Leadership", "Product Strategy", "Machine Learning", "Team Building"],
        endorsements: {
          "AI": 45,
          "Leadership": 38,
          "Product Strategy": 32,
          "Machine Learning": 28,
          "Team Building": 25
        }
      });
    }

    const surfaceData = await DeepRepoService.getRepoLayer(testUserId, 'surface');

    // Create visualization nodes from Surface Repo data
    const nodes: any[] = [];
    const links: any[] = [];

    // Central profile node
    nodes.push({
      id: 'profile',
      name: 'Professional Profile',
      group: 'profile',
      color: '#0077B5', // LinkedIn blue
      size: 40,
      x: 0,
      y: 0,
      z: 0
    });

    // Experience nodes
    if (surfaceData?.experience) {
      surfaceData.experience.forEach((exp: any, index: number) => {
        const expId = `exp-${index}`;
        nodes.push({
          id: expId,
          name: exp.company,
          group: 'experience',
          color: '#FF6B6B',
          size: 25,
          x: 100 * Math.cos(index * Math.PI / 3),
          y: 100 * Math.sin(index * Math.PI / 3),
          z: 0,
          value: exp.title
        });
        links.push({ source: 'profile', target: expId });
      });
    }

    // Skills nodes
    if (surfaceData?.skills) {
      surfaceData.skills.forEach((skill: string, index: number) => {
        const skillId = `skill-${index}`;
        const endorsements = surfaceData.endorsements?.[skill] || 0;
        nodes.push({
          id: skillId,
          name: skill,
          group: 'skill',
          color: '#4ECDC4',
          size: 10 + (endorsements / 5), // Size based on endorsements
          x: 150 * Math.cos(index * 2 * Math.PI / surfaceData.skills.length),
          y: 150 * Math.sin(index * 2 * Math.PI / surfaceData.skills.length),
          z: 50,
          value: `${endorsements} endorsements`
        });
        links.push({ source: 'profile', target: skillId });
      });
    }

    return NextResponse.json({
      message: 'Surface Repo visualization ready',
      userId: testUserId,
      surfaceRepo: surfaceData,
      visualization: {
        nodes,
        links
      }
    });

  } catch (error) {
    console.error('Surface Repo visualization error:', error);
    return NextResponse.json({ 
      error: 'Failed to get Surface Repo visualization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}