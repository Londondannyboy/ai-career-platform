import { faker } from '@faker-js/faker';
import type { WorkExperienceWithFuture } from '@/types/work-experience';
import type { ProfessionalOKR, KeyResult } from '@/lib/repo/okrService';
import type { Goal, Task } from '@/lib/repo/goalService';

// Define types we need inline to avoid import issues
interface Skill {
  id: string;
  name: string;
  category: 'Technical' | 'Business' | 'Creative' | 'Leadership' | 'Data & Analytics' | 'Other';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
  lastUsed?: string;
  endorsements?: number;
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  achievements?: string[];
  isFuture?: boolean;
  plannedCompletion?: string;
  whyThisDegree?: string;
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  dateObtained?: string;
  expiryDate?: string;
  status: 'completed' | 'in-progress' | 'planned';
  verificationUrl?: string;
  skills?: string[];
  targetDate?: string;
}

// Skill categories and examples
const SKILL_CATEGORIES = {
  Technical: ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'SQL', 'MongoDB'],
  Business: ['Project Management', 'Strategic Planning', 'Business Analysis', 'Product Management', 'Agile', 'Scrum'],
  Creative: ['UI/UX Design', 'Graphic Design', 'Content Writing', 'Video Editing', 'Branding'],
  Leadership: ['Team Leadership', 'Mentoring', 'Executive Communication', 'Change Management', 'Conflict Resolution'],
  'Data & Analytics': ['Data Analysis', 'Machine Learning', 'Data Visualization', 'Statistical Analysis', 'A/B Testing']
};

const COMPANIES = [
  { name: 'TechCorp', canonical_identifier: 'techcorp_sf_2010', isValidated: true },
  { name: 'InnovateLabs', canonical_identifier: 'innovatelabs_ny_2015', isValidated: true },
  { name: 'DataDynamics', canonical_identifier: 'datadynamics_sea_2018', isValidated: true },
  { name: 'CloudVentures', canonical_identifier: 'cloudventures_aus_2020', isValidated: false },
  { name: 'FutureTech', canonical_identifier: 'futuretech_lon_2022', isValidated: false }
];

const FUTURE_COMPANIES = [
  { name: 'Google', canonical_identifier: 'google_mountain_view_1998', isValidated: true },
  { name: 'Microsoft', canonical_identifier: 'microsoft_redmond_1975', isValidated: true },
  { name: 'Amazon', canonical_identifier: 'amazon_seattle_1994', isValidated: true },
  { name: 'Meta', canonical_identifier: 'meta_menlo_park_2004', isValidated: true },
  { name: 'Apple', canonical_identifier: 'apple_cupertino_1976', isValidated: true }
];

const UNIVERSITIES = [
  'Stanford University',
  'MIT',
  'Harvard University',
  'UC Berkeley',
  'Carnegie Mellon University'
];

const CERTIFICATIONS = [
  { name: 'AWS Certified Solutions Architect', provider: 'Amazon Web Services' },
  { name: 'Google Cloud Professional', provider: 'Google' },
  { name: 'PMP Certification', provider: 'Project Management Institute' },
  { name: 'Certified Scrum Master', provider: 'Scrum Alliance' },
  { name: 'Microsoft Azure Administrator', provider: 'Microsoft' }
];

export function generateTestData() {
  const currentDate = new Date();
  const userId = 'test-user-' + Date.now();
  
  // Generate Surface Repo Data
  const surfaceRepo = {
    name: faker.person.fullName(),
    bio: faker.person.bio(),
    location: faker.location.city() + ', ' + faker.location.country(),
    contact: {
      email: faker.internet.email(),
      linkedin: 'https://linkedin.com/in/' + faker.internet.username(),
      github: 'https://github.com/' + faker.internet.username()
    },
    experience: generateWorkExperiences()
  };
  
  // Generate Working Repo Data
  const workingRepo = {
    skills: generateSkills(),
    education: generateEducation(),
    certifications: generateCertifications(),
    languages: [
      { name: 'English', proficiency: 'Native' },
      { name: 'Spanish', proficiency: 'Professional' },
      { name: 'French', proficiency: 'Conversational' }
    ]
  };
  
  // Generate Personal Repo Data
  const okrs = generateOKRs();
  const goals = generateGoals(okrs);
  
  const personalRepo = {
    okrs,
    goals,
    dailyPlans: generateDailyPlans(goals)
  };
  
  return {
    userId,
    surfaceRepo,
    workingRepo,
    personalRepo,
    deepRepo: {
      trinity: {
        quest: "To revolutionize how professionals track and achieve their career aspirations",
        service: "I serve by building innovative solutions that empower others to reach their potential",
        pledge: "I pledge to maintain integrity, pursue continuous learning, and lift others as I climb"
      }
    }
  };
}

function generateWorkExperiences(): WorkExperienceWithFuture[] {
  const experiences: WorkExperienceWithFuture[] = [];
  
  // Generate 3 past experiences
  for (let i = 0; i < 3; i++) {
    const startDate = faker.date.past({ years: 8 - i * 2 });
    const endDate = i === 0 ? undefined : faker.date.between({ from: startDate, to: new Date() });
    const company = COMPANIES[i];
    
    experiences.push({
      id: faker.string.uuid(),
      title: faker.person.jobTitle(),
      company: company,
      location: faker.location.city(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      isCurrent: i === 0,
      isFuture: false,
      description: faker.lorem.paragraph(),
      achievements: [
        `Led team of ${faker.number.int({ min: 3, max: 15 })} engineers`,
        `Increased performance by ${faker.number.int({ min: 20, max: 80 })}%`,
        `Managed budget of $${faker.number.int({ min: 100, max: 500 })}K`
      ],
      skills: faker.helpers.arrayElements(
        [...SKILL_CATEGORIES.Technical, ...SKILL_CATEGORIES.Business],
        faker.number.int({ min: 3, max: 7 })
      )
    });
  }
  
  // Generate 2 future aspirations
  for (let i = 0; i < 2; i++) {
    const targetDate = faker.date.future({ years: 3 + i * 2 });
    const futureCompany = FUTURE_COMPANIES[i];
    
    experiences.push({
      id: faker.string.uuid(),
      title: `Senior ${faker.person.jobTitle()}`,
      company: futureCompany,
      location: faker.location.city(),
      startDate: targetDate.toISOString().split('T')[0],
      isCurrent: false,
      isFuture: true,
      description: faker.lorem.paragraph(),
      achievements: [
        `Lead transformation of ${faker.company.buzzNoun()} systems`,
        `Scale team from ${faker.number.int({ min: 10, max: 20 })} to ${faker.number.int({ min: 30, max: 50 })} engineers`,
        `Drive ${faker.number.int({ min: 30, max: 70 })}% improvement in key metrics`
      ],
      skills: faker.helpers.arrayElements(
        [...SKILL_CATEGORIES.Technical, ...SKILL_CATEGORIES.Leadership],
        faker.number.int({ min: 5, max: 10 })
      ),
      targetDate: targetDate.toISOString().split('T')[0],
      whyThisRole: faker.lorem.paragraph(),
      requiredSteps: [
        'Master advanced ' + faker.helpers.arrayElement(SKILL_CATEGORIES.Technical),
        'Complete ' + faker.helpers.arrayElement(CERTIFICATIONS).name,
        'Lead ' + faker.number.int({ min: 2, max: 5 }) + ' major projects',
        'Build network in ' + faker.company.buzzNoun() + ' industry'
      ],
      skillGaps: faker.helpers.arrayElements(
        [...SKILL_CATEGORIES.Technical, ...SKILL_CATEGORIES.Leadership],
        faker.number.int({ min: 2, max: 4 })
      ),
      connections: [
        faker.person.fullName() + ' - ' + faker.person.jobTitle(),
        faker.person.fullName() + ' - ' + faker.person.jobTitle()
      ],
      progress: faker.number.int({ min: 10, max: 60 })
    });
  }
  
  return experiences;
}

function generateSkills(): Skill[] {
  const skills: Skill[] = [];
  
  Object.entries(SKILL_CATEGORIES).forEach(([category, skillList]) => {
    const selectedSkills = faker.helpers.arrayElements(
      skillList,
      faker.number.int({ min: 2, max: 5 })
    );
    
    selectedSkills.forEach(skillName => {
      skills.push({
        id: faker.string.uuid(),
        name: skillName,
        category: category as any,
        proficiency: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
        yearsOfExperience: faker.number.int({ min: 1, max: 10 }),
        lastUsed: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
        endorsements: faker.number.int({ min: 0, max: 20 })
      });
    });
  });
  
  return skills;
}

function generateEducation(): EducationItem[] {
  return [
    {
      id: faker.string.uuid(),
      institution: faker.helpers.arrayElement(UNIVERSITIES),
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: faker.date.past({ years: 8 }).toISOString().split('T')[0],
      endDate: faker.date.past({ years: 4 }).toISOString().split('T')[0],
      gpa: faker.number.float({ min: 3.0, max: 4.0, fractionDigits: 1 }),
      achievements: [
        'Dean\'s List',
        'Computer Science Honor Society',
        'Hackathon Winner'
      ]
    },
    {
      id: faker.string.uuid(),
      institution: faker.helpers.arrayElement(UNIVERSITIES),
      degree: 'Master of Science',
      field: 'Data Science',
      startDate: faker.date.future({ years: 1 }).toISOString().split('T')[0],
      isFuture: true,
      plannedCompletion: faker.date.future({ years: 3 }).toISOString().split('T')[0],
      whyThisDegree: 'To deepen my expertise in machine learning and AI'
    }
  ];
}

function generateCertifications(): Certification[] {
  return CERTIFICATIONS.slice(0, 3).map((cert, index) => ({
    id: faker.string.uuid(),
    name: cert.name,
    provider: cert.provider,
    dateObtained: index < 2 ? faker.date.past({ years: 2 }).toISOString().split('T')[0] : undefined,
    expiryDate: index < 2 ? faker.date.future({ years: 2 }).toISOString().split('T')[0] : undefined,
    status: index < 2 ? 'completed' as const : 'in-progress' as const,
    verificationUrl: index < 2 ? faker.internet.url() : undefined,
    skills: faker.helpers.arrayElements(SKILL_CATEGORIES.Technical, 3),
    targetDate: index >= 2 ? faker.date.future({ years: 1 }).toISOString().split('T')[0] : undefined
  }));
}

function generateOKRs(): ProfessionalOKR[] {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  
  return [
    {
      id: faker.string.uuid(),
      objective: 'Advance to Senior Engineering role by demonstrating technical leadership',
      timeframe: `Q${currentQuarter}` as any,
      year: currentYear,
      keyResults: [
        {
          id: faker.string.uuid(),
          description: 'Lead 3 cross-functional projects to successful completion',
          targetValue: 3,
          currentValue: 1,
          unit: 'count',
          status: 'on-track',
          lastUpdated: new Date().toISOString()
        },
        {
          id: faker.string.uuid(),
          description: 'Mentor 2 junior engineers through their first major features',
          targetValue: 2,
          currentValue: 1,
          unit: 'count',
          status: 'on-track',
          lastUpdated: new Date().toISOString()
        },
        {
          id: faker.string.uuid(),
          description: 'Achieve 90% positive feedback on technical presentations',
          targetValue: 90,
          currentValue: 85,
          unit: 'percentage',
          status: 'on-track',
          lastUpdated: new Date().toISOString()
        }
      ],
      category: 'career',
      visibility: 'private',
      status: 'active',
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      objective: 'Build expertise in cloud architecture and DevOps practices',
      timeframe: `Q${currentQuarter}` as any,
      year: currentYear,
      keyResults: [
        {
          id: faker.string.uuid(),
          description: 'Complete AWS Solutions Architect certification',
          targetValue: 1,
          currentValue: 0.7,
          unit: 'boolean',
          status: 'on-track',
          lastUpdated: new Date().toISOString()
        },
        {
          id: faker.string.uuid(),
          description: 'Migrate 5 services to containerized architecture',
          targetValue: 5,
          currentValue: 2,
          unit: 'count',
          status: 'at-risk',
          lastUpdated: new Date().toISOString()
        }
      ],
      category: 'skill',
      visibility: 'coach',
      status: 'active',
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateGoals(okrs: ProfessionalOKR[]): Goal[] {
  const goals: Goal[] = [];
  
  // Create goals linked to OKRs
  okrs.forEach(okr => {
    goals.push({
      id: faker.string.uuid(),
      title: `Complete ${okr.objective.substring(0, 50)}...`,
      description: `Breaking down the OKR: ${okr.objective}`,
      type: 'milestone',
      status: 'active',
      linkedOKRId: okr.id,
      targetDate: faker.date.future({ years: 0.25 }).toISOString().split('T')[0],
      progress: faker.number.int({ min: 20, max: 60 }),
      tasks: generateTasks(3),
      successCriteria: [
        'All key results achieved',
        'Positive feedback from stakeholders',
        'Documentation completed'
      ],
      visibility: 'private',
      createdAt: faker.date.recent({ days: 14 }).toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  
  // Add standalone goal
  goals.push({
    id: faker.string.uuid(),
    title: 'Establish daily learning habit',
    description: 'Dedicate time each day to continuous learning',
    type: 'habit',
    status: 'active',
    progress: 40,
    tasks: generateTasks(5),
    successCriteria: [
      '30 minutes daily learning',
      'Complete one course per month',
      'Share learnings weekly'
    ],
    visibility: 'accountability',
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return goals;
}

function generateTasks(count: number): Task[] {
  const tasks: Task[] = [];
  
  for (let i = 0; i < count; i++) {
    const status = faker.helpers.arrayElement(['todo', 'in-progress', 'done', 'todo']);
    tasks.push({
      id: faker.string.uuid(),
      title: faker.hacker.phrase(),
      description: faker.lorem.sentence(),
      status: status as any,
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'high']) as any,
      dueDate: faker.date.future({ years: 0.1 }).toISOString().split('T')[0],
      completedDate: status === 'done' ? faker.date.recent({ days: 3 }).toISOString() : undefined,
      estimatedHours: faker.number.int({ min: 1, max: 8 }),
      actualHours: status === 'done' ? faker.number.int({ min: 1, max: 10 }) : undefined,
      createdAt: faker.date.recent({ days: 14 }).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return tasks;
}

function generateDailyPlans(goals: Goal[]): any[] {
  const plans = [];
  const allTasks = goals.flatMap(g => g.tasks);
  
  // Create plans for the last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    plans.push({
      id: faker.string.uuid(),
      date: date.toISOString().split('T')[0],
      tasks: faker.helpers.arrayElements(allTasks, faker.number.int({ min: 2, max: 5 })).map(t => t.id),
      reflection: i > 2 ? {
        accomplishments: ['Completed key features', 'Great team collaboration'],
        challenges: ['Time management', 'Technical blockers'],
        tomorrowPriorities: ['Focus on testing', 'Documentation'],
        energyLevel: faker.number.int({ min: 3, max: 5 }) as any,
        focusRating: faker.number.int({ min: 3, max: 5 }) as any
      } : undefined,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    });
  }
  
  return plans;
}

// Export a function to save test data
export async function saveTestData() {
  const testData = generateTestData();
  
  try {
    // Save Surface Repo
    await fetch('/api/surface-repo/save-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: testData.surfaceRepo })
    });
    
    // Save Working Repo - Skills
    await fetch('/api/deep-repo/working/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: testData.workingRepo.skills })
    });
    
    // Save Working Repo - Education
    await fetch('/api/deep-repo/working/education', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: testData.workingRepo.education,
        certifications: testData.workingRepo.certifications 
      })
    });
    
    // Save Personal Repo - OKRs
    await fetch('/api/deep-repo/personal/okr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ okrs: testData.personalRepo.okrs })
    });
    
    // Save Personal Repo - Goals
    await fetch('/api/deep-repo/personal/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goals: testData.personalRepo.goals,
        dailyPlans: testData.personalRepo.dailyPlans 
      })
    });
    
    // Save Deep Repo - Trinity
    await fetch('/api/deep-repo/deep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        data: testData.deepRepo,
        userId: testData.userId 
      })
    });
    
    console.log('Test data saved successfully!');
    return testData;
  } catch (error) {
    console.error('Error saving test data:', error);
    throw error;
  }
}