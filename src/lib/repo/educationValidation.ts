export interface Education {
  id?: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  gpa?: number;
  showGpa?: boolean;
  activities?: string[];
  honors?: string[];
  description?: string;
  isPlanned?: boolean; // Future education
  targetStartDate?: string;
  whyThisDegree?: string;
  requiredForCareer?: string; // Link to career goal
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[]; // Skills this cert validates
  isPlanned?: boolean; // Future certification
  targetDate?: string;
  studyPlan?: string;
  linkedToGoal?: string; // OKR reference
  estimatedStudyHours?: number;
  cost?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface CertificationWarning {
  certId: string;
  certName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'expired' | 'critical' | 'warning' | 'info';
}

// Popular certifications by category
export const POPULAR_CERTIFICATIONS = {
  'Cloud': [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud' },
    { name: 'Microsoft Azure Administrator', issuer: 'Microsoft' },
    { name: 'AWS Certified Developer', issuer: 'Amazon Web Services' },
    { name: 'Google Cloud Professional Data Engineer', issuer: 'Google Cloud' }
  ],
  'Project Management': [
    { name: 'PMP - Project Management Professional', issuer: 'PMI' },
    { name: 'Certified Scrum Master (CSM)', issuer: 'Scrum Alliance' },
    { name: 'PRINCE2 Practitioner', issuer: 'AXELOS' },
    { name: 'Agile Certified Practitioner (PMI-ACP)', issuer: 'PMI' },
    { name: 'Six Sigma Green Belt', issuer: 'Various' }
  ],
  'Security': [
    { name: 'CISSP', issuer: 'ISC2' },
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'Certified Ethical Hacker (CEH)', issuer: 'EC-Council' },
    { name: 'CISA', issuer: 'ISACA' },
    { name: 'CompTIA CySA+', issuer: 'CompTIA' }
  ],
  'Data': [
    { name: 'Google Data Analytics Certificate', issuer: 'Google' },
    { name: 'IBM Data Science Professional Certificate', issuer: 'IBM' },
    { name: 'Microsoft Certified: Azure Data Scientist', issuer: 'Microsoft' },
    { name: 'Tableau Desktop Specialist', issuer: 'Tableau' },
    { name: 'SAS Certified Base Programmer', issuer: 'SAS' }
  ],
  'Development': [
    { name: 'Oracle Certified Java Developer', issuer: 'Oracle' },
    { name: 'Microsoft Certified: Azure Developer', issuer: 'Microsoft' },
    { name: 'Meta Front-End Developer Certificate', issuer: 'Meta' },
    { name: 'Google Associate Android Developer', issuer: 'Google' },
    { name: 'Full Stack Web Developer', issuer: 'Various' }
  ]
};

// Common degrees for autocomplete
export const COMMON_DEGREES = [
  'Bachelor of Science (B.S.)',
  'Bachelor of Arts (B.A.)',
  'Master of Science (M.S.)',
  'Master of Arts (M.A.)',
  'Master of Business Administration (MBA)',
  'Doctor of Philosophy (Ph.D.)',
  'Bachelor of Engineering (B.E.)',
  'Master of Engineering (M.Eng.)',
  'Juris Doctor (J.D.)',
  'Doctor of Medicine (M.D.)',
  'Associate of Science (A.S.)',
  'Associate of Arts (A.A.)'
];

// Common fields of study
export const COMMON_FIELDS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Business Administration',
  'Finance',
  'Marketing',
  'Psychology',
  'Economics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Information Technology',
  'Cybersecurity',
  'Artificial Intelligence',
  'Machine Learning',
  'Design',
  'Communications',
  'English',
  'History',
  'Political Science',
  'International Relations'
];

// Validation functions
export function validateEducation(education: Education): string[] {
  const errors: string[] = [];
  
  if (!education.school) errors.push('School is required');
  if (!education.degree) errors.push('Degree is required');
  if (!education.field) errors.push('Field of study is required');
  if (!education.startDate && !education.isPlanned) errors.push('Start date is required');
  
  if (education.gpa !== undefined) {
    if (education.gpa < 0 || education.gpa > 4.0) {
      errors.push('GPA must be between 0.0 and 4.0');
    }
  }
  
  if (education.startDate && education.endDate) {
    const start = new Date(education.startDate);
    const end = new Date(education.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }
  
  return errors;
}

export function validateCertification(certification: Certification): string[] {
  const errors: string[] = [];
  
  if (!certification.name) errors.push('Certification name is required');
  if (!certification.issuer) errors.push('Issuer is required');
  
  if (!certification.isPlanned && !certification.issueDate) {
    errors.push('Issue date is required for completed certifications');
  }
  
  if (certification.issueDate && certification.expiryDate) {
    const issue = new Date(certification.issueDate);
    const expiry = new Date(certification.expiryDate);
    if (expiry <= issue) {
      errors.push('Expiry date must be after issue date');
    }
  }
  
  if (certification.credentialUrl && !isValidUrl(certification.credentialUrl)) {
    errors.push('Invalid credential URL');
  }
  
  return errors;
}

export function checkCertificationExpiry(certifications: Certification[]): CertificationWarning[] {
  const warnings: CertificationWarning[] = [];
  const today = new Date();
  
  certifications.forEach(cert => {
    if (cert.expiryDate && !cert.isPlanned) {
      const expiryDate = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        warnings.push({
          certId: cert.id!,
          certName: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry: Math.abs(daysUntilExpiry),
          severity: 'expired'
        });
      } else if (daysUntilExpiry <= 30) {
        warnings.push({
          certId: cert.id!,
          certName: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          severity: 'critical'
        });
      } else if (daysUntilExpiry <= 60) {
        warnings.push({
          certId: cert.id!,
          certName: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          severity: 'warning'
        });
      } else if (daysUntilExpiry <= 90) {
        warnings.push({
          certId: cert.id!,
          certName: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          severity: 'info'
        });
      }
    }
  });
  
  return warnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}