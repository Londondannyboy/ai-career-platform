// Tiered Repository System Types

export type RepoTier = 'SURFACE' | 'MID' | 'DEEP' | 'FULL'
export type NetworkRequestType = 'CONNECTION' | 'MID_ACCESS' | 'DEEP_ACCESS' | 'FULL_ACCESS'
export type ExportFormat = 'PDF_STANDARD' | 'PDF_TECH' | 'PDF_CREATIVE' | 'PDF_EXECUTIVE' | 'PDF_STARTUP'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED'

// Surface Repo - LinkedIn-style public profile
export interface SurfaceRepo {
  id: string
  user_id: string
  
  // Basic Information
  professional_headline: string
  summary?: string
  current_role?: string
  current_company?: string
  location?: string
  
  // Experience
  work_experience: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  
  // Skills & Endorsements
  core_skills: string[]
  skill_endorsements: Record<string, number>
  languages: Language[]
  
  // Portfolio & Links
  portfolio_items: PortfolioItem[]
  social_links: Record<string, string>
  
  // Export Settings
  preferred_export_format: ExportFormat
  custom_templates: Record<string, unknown>
  
  // Visibility & Privacy
  is_public: boolean
  is_searchable: boolean
  show_contact_info: boolean
  
  created_at: string
  updated_at: string
}

export interface WorkExperience {
  title: string
  company: string
  duration: string
  description: string
  achievements: string[]
  start_date?: string
  end_date?: string
  is_current?: boolean
}

export interface Education {
  institution: string
  degree: string
  field: string
  year: string
  honors?: string
  gpa?: string
}

export interface Certification {
  name: string
  issuer: string
  date: string
  credential_id?: string
  expiry_date?: string
}

export interface Language {
  language: string
  proficiency: 'Basic' | 'Conversational' | 'Professional' | 'Native'
}

export interface PortfolioItem {
  title: string
  description: string
  url?: string
  type: 'Project' | 'Article' | 'Presentation' | 'Award' | 'Other'
  featured: boolean
  media_urls?: string[]
}

// Mid Repo - Professional depth for recruiters
export interface MidRepo {
  id: string
  user_id: string
  
  // Detailed Professional Information
  detailed_achievements: DetailedAchievement[]
  project_deep_dives: ProjectDeepDive[]
  leadership_examples: LeadershipExample[]
  
  // Performance & Recognition
  performance_reviews: PerformanceReview[]
  awards_recognition: Award[]
  peer_recommendations: Recommendation[]
  
  // Career Progression
  salary_progression: SalaryInfo[]
  career_transitions: CareerTransition[]
  industry_expertise: IndustryExpertise[]
  
  // Professional Network
  internal_referrals: InternalReferral[]
  mentorship_given: MentorshipRecord[]
  mentorship_received: MentorshipRecord[]
  
  created_at: string
  updated_at: string
}

export interface DetailedAchievement {
  role: string
  company: string
  metrics: string[]
  impact: string
  context: string
  timeline: string
}

export interface ProjectDeepDive {
  title: string
  role: string
  challenge: string
  solution: string
  outcome: string
  technologies: string[]
  team_size?: number
  duration: string
}

export interface LeadershipExample {
  situation: string
  action: string
  result: string
  team_size: number
  duration: string
  skills_demonstrated: string[]
}

export interface PerformanceReview {
  period: string
  company: string
  highlights: string[]
  ratings: Record<string, number>
  feedback_summary: string
}

export interface Award {
  title: string
  organization: string
  year: string
  description: string
  significance: string
}

export interface Recommendation {
  recommender: string
  relationship: string
  text: string
  date: string
  company?: string
}

export interface SalaryInfo {
  role: string
  company: string
  year: string
  range: string
  equity?: string
  total_compensation?: string
}

export interface CareerTransition {
  from_role: string
  to_role: string
  reason: string
  challenges: string[]
  outcomes: string[]
  lessons_learned: string
}

export interface IndustryExpertise {
  domain: string
  years: number
  depth: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  notable_work: string[]
}

export interface InternalReferral {
  company: string
  contact_name: string
  relationship: string
  context: string
}

export interface MentorshipRecord {
  name?: string // For mentorship_received
  role?: string // For mentorship_given
  focus: string
  duration: string
  outcomes: string[]
}

// Deep Repo - Authentic peer/coach sharing
export interface DeepRepo {
  id: string
  user_id: string
  
  // Honest Self-Assessment
  core_strengths: CoreStrength[]
  growth_areas: GrowthArea[]
  working_style: WorkingStyle
  
  // Learning & Development
  skill_gaps: SkillGap[]
  failed_experiments: FailedExperiment[]
  feedback_received: FeedbackRecord[]
  
  // Professional Challenges
  career_obstacles: CareerObstacle[]
  difficult_decisions: DifficultDecision[]
  conflicts_resolved: ConflictResolution[]
  
  // Peer Insights
  feedback_360: Feedback360[]
  collaboration_style: CollaborationStyle
  leadership_philosophy: LeadershipPhilosophy
  
  created_at: string
  updated_at: string
}

export interface CoreStrength {
  strength: string
  evidence: string[]
  development_stage: 'Emerging' | 'Developing' | 'Proficient' | 'Advanced'
}

export interface GrowthArea {
  area: string
  current_level: string
  target: string
  action_plan: string[]
  timeline: string
}

export interface WorkingStyle {
  preferences: string[]
  communication: string
  decision_making: string
  stress_response: string
}

export interface SkillGap {
  skill: string
  importance: 'Low' | 'Medium' | 'High' | 'Critical'
  current_level: string
  learning_plan: string[]
}

export interface FailedExperiment {
  attempt: string
  context: string
  lesson_learned: string
  next_steps: string[]
}

export interface FeedbackRecord {
  source: string
  topic: string
  feedback: string
  action_taken: string
  date: string
}

export interface CareerObstacle {
  challenge: string
  impact: string
  coping_strategy: string[]
  outcome: string
}

export interface DifficultDecision {
  situation: string
  options: string[]
  choice: string
  reasoning: string
  result: string
}

export interface ConflictResolution {
  context: string
  approach: string
  outcome: string
  learning: string
}

export interface Feedback360 {
  reviewer_role: string
  strengths: string[]
  improvements: string[]
  overall: string
  date: string
}

export interface CollaborationStyle {
  approach: string
  preferences: string[]
  effectiveness: string
}

export interface LeadershipPhilosophy {
  beliefs: string[]
  approach: string
  examples: string[]
}

// Full Repo - Life goals and personal mission
export interface FullRepo {
  id: string
  user_id: string
  
  // Life & Career Vision
  personal_mission?: string
  life_goals: LifeGoal[]
  career_aspirations: CareerAspiration[]
  legacy_goals: LegacyGoal[]
  
  // Values & Motivation
  core_values: CoreValue[]
  motivations: Motivation[]
  deal_breakers: DealBreaker[]
  
  // Work-Life Integration
  life_priorities: LifePriority[]
  family_considerations: FamilyConsiderations
  geographic_preferences: GeographicPreferences
  
  // Personal Development
  character_development: CharacterDevelopment[]
  life_lessons: LifeLesson[]
  support_network: SupportPerson[]
  
  // Future Planning
  scenario_planning: Scenario[]
  contingency_plans: ContingencyPlan[]
  retirement_vision: RetirementVision
  
  created_at: string
  updated_at: string
}

export interface LifeGoal {
  goal: string
  timeline: string
  progress: string
  obstacles: string[]
  importance: 'Low' | 'Medium' | 'High' | 'Critical'
}

export interface CareerAspiration {
  role: string
  industry?: string
  timeline: string
  steps: string[]
  motivation: string
}

export interface LegacyGoal {
  impact: string
  timeline: string
  measures: string[]
}

export interface CoreValue {
  value: string
  description: string
  examples: string[]
}

export interface Motivation {
  driver: string
  context: string
  evolution: string
}

export interface DealBreaker {
  factor: string
  reason: string
  flexibility: 'None' | 'Limited' | 'Moderate' | 'High'
}

export interface LifePriority {
  priority: string
  weight: number
  balance_strategy: string
}

export interface FamilyConsiderations {
  commitments: string[]
  constraints: string[]
  support: string[]
}

export interface GeographicPreferences {
  locations: string[]
  flexibility: string
  reasons: string[]
}

export interface CharacterDevelopment {
  trait: string
  current_state: string
  desired_state: string
  development_plan: string[]
}

export interface LifeLesson {
  lesson: string
  source: string
  application: string
}

export interface SupportPerson {
  person: string
  relationship: string
  support_type: string[]
}

export interface Scenario {
  scenario: string
  probability: 'Low' | 'Medium' | 'High'
  preparation: string[]
}

export interface ContingencyPlan {
  situation: string
  response: string[]
  resources_needed: string[]
}

export interface RetirementVision {
  timeline: string
  lifestyle: string
  preparation: string[]
}

// Network Requests
export interface NetworkRequest {
  id: string
  sender_id: string
  receiver_id: string
  request_type: NetworkRequestType
  
  // Request Details
  purpose: string
  message?: string
  professional_context?: string
  mutual_connections: string[]
  
  // Justification for Access Level
  access_justification?: string
  intended_use?: string
  referral_source?: string
  
  // Status & Timeline
  status: RequestStatus
  expires_at?: string
  responded_at?: string
  
  created_at: string
  updated_at: string
}

// Repo Access Permissions
export interface RepoAccess {
  id: string
  owner_id: string
  granted_to_id: string
  
  // Access Levels
  surface_access: boolean
  mid_access: boolean
  deep_access: boolean
  full_access: boolean
  
  // Access Context
  relationship_type?: string
  granted_reason?: string
  access_source?: string
  
  // Time & Usage Tracking
  granted_at: string
  expires_at?: string
  last_accessed?: string
  access_count: number
  
  // Permissions
  can_export_pdf: boolean
  can_add_feedback: boolean
  can_see_network: boolean
  
  created_at: string
  updated_at: string
}

// PDF Templates
export interface PDFTemplate {
  id: string
  user_id: string
  
  template_name: string
  job_type: string
  industry?: string
  
  // Template Configuration
  sections_included: string[]
  section_order: string[]
  emphasis_areas: string[]
  
  // Styling
  color_scheme: string
  font_choice: string
  layout_style: string
  
  // Content Customization
  custom_summary?: string
  skills_filter: string[]
  experience_filter: Record<string, unknown>
  
  is_default: boolean
  
  created_at: string
  updated_at: string
}

// Peer Feedback
export interface PeerFeedback {
  id: string
  feedback_giver_id: string
  feedback_receiver_id: string
  
  // Feedback Content
  strengths_observed: string[]
  growth_suggestions: string[]
  collaboration_rating: number // 1-5
  communication_rating: number // 1-5
  leadership_rating: number // 1-5
  
  // Context
  relationship_context: string
  time_period?: string
  project_context?: string
  
  // Metadata
  is_anonymous: boolean
  is_verified: boolean
  visibility_level: RepoTier
  
  created_at: string
  updated_at: string
}

// Combined repo view for easy access
export interface UserRepoAccess {
  user_id: string
  surface?: SurfaceRepo
  mid?: MidRepo
  deep?: DeepRepo
  full?: FullRepo
  access_permissions: RepoAccess
  peer_feedback: PeerFeedback[]
}