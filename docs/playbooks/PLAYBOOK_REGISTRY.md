# Quest Playbook Registry

## Overview
This document defines all available coaching playbooks in the Quest AI Platform, their specializations, and how they interact with each other in multi-agent coaching scenarios.

## Playbook Categories

### 1. Primary Coaches
**Core coaching specialties that can lead entire sessions**

#### 1.1 Career Development
- **`career_coaching`** - General career guidance and professional development
- **`leadership_coaching`** - Leadership skills, team management, executive presence
- **`skill_development`** - Technical and soft skill enhancement
- **`career_transition`** - Role changes, industry switches, career pivots

#### 1.2 Business Function Specialists
- **`marketing_coach`** - Marketing strategy, campaigns, brand development
- **`sales_coach`** - Sales techniques, pipeline management, client relations
- **`engineering_coach`** - Technical leadership, architecture, code quality
- **`product_coach`** - Product management, roadmaps, user experience
- **`finance_coach`** - Financial planning, budgeting, investment strategies

#### 1.3 Industry Specialists
- **`startup_coach`** - Entrepreneurship, fundraising, scaling challenges
- **`enterprise_coach`** - Large organization navigation, corporate politics
- **`consulting_coach`** - Client management, project delivery, expertise positioning
- **`freelance_coach`** - Independent work, client acquisition, time management

### 2. Support Coaches
**Specialized coaches that complement primary coaching**

#### 2.1 Productivity & Performance
- **`productivity_coach`** - Time management, workflow optimization, efficiency
- **`procrastination_coach`** - Overcoming delays, motivation, action taking
- **`stress_management`** - Stress reduction, burnout prevention, resilience
- **`focus_coach`** - Concentration, deep work, distraction management

#### 2.2 Communication & Relationships
- **`communication_coach`** - Presentation skills, difficult conversations, clarity
- **`networking_coach`** - Professional relationships, industry connections
- **`negotiation_coach`** - Salary negotiation, contract terms, conflict resolution
- **`feedback_coach`** - Giving and receiving feedback, performance reviews

#### 2.3 Personal Development
- **`confidence_coach`** - Self-esteem, imposter syndrome, presence
- **`work_life_balance`** - Boundary setting, personal time, health integration
- **`mindset_coach`** - Growth mindset, limiting beliefs, perspective shifts
- **`goal_setting`** - SMART goals, accountability, progress tracking

### 3. Execution Coaches
**Specialists focused on implementation and action**

#### 3.1 Implementation Specialists
- **`delivery_coach`** - Project execution, milestone achievement, results delivery
- **`accountability_coach`** - Follow-through, commitment keeping, progress monitoring
- **`strategy_coach`** - Strategic planning, decision making, long-term thinking
- **`change_coach`** - Organizational change, process improvement, transformation

#### 3.2 Learning & Development
- **`learning_coach`** - Skill acquisition, knowledge retention, continuous improvement
- **`mentor_coach`** - Mentoring others, knowledge transfer, succession planning
- **`innovation_coach`** - Creative thinking, problem solving, ideation

### 4. Contextual Coaches
**Coaches that adapt to specific situations or content**

#### 4.1 Situational Specialists
- **`interview_coach`** - Job interviews, technical interviews, behavioral questions
- **`presentation_coach`** - Public speaking, slide design, audience engagement
- **`meeting_coach`** - Meeting facilitation, participation, outcomes
- **`crisis_coach`** - Crisis management, difficult situations, emergency response

#### 4.2 Content-Aware Coaches
- **`news_coach`** - Industry trends, market analysis, current events integration
- **`company_coach`** - Company-specific coaching (e.g., CK Delta Coach)
- **`topic_coach`** - Subject matter expertise, deep domain knowledge
- **`real_time_coach`** - Live coaching during actual work situations

## Playbook Relationships

### Coaching Combinations
Common multi-agent coaching scenarios:

#### Sequential Coaching
- **Career Coach → Delivery Coach**: Strategy development followed by execution planning
- **Marketing Coach → Productivity Coach**: Campaign planning followed by efficiency optimization
- **Leadership Coach → Communication Coach**: Leadership development followed by presentation skills

#### Parallel Coaching
- **Career Coach + Networking Coach**: Simultaneous career development and relationship building
- **Productivity Coach + Stress Management**: Efficiency with wellbeing balance
- **Strategy Coach + Innovation Coach**: Strategic thinking with creative problem solving

#### Intervention Coaching
- **Primary Coach calls Support Coach**: "Let me bring in our productivity coach..."
- **System-triggered Support**: Procrastination patterns trigger procrastination coach
- **User-requested Specialist**: "Can you get the negotiation coach?"

### Relationship-Aware Coaching

#### Upward Coaching (Coaching Your Manager)
- **`upward_management`** - Managing up, influencing superiors, career advancement
- **`reverse_mentoring`** - Teaching senior leaders, knowledge transfer upward
- **`executive_coaching`** - C-level coaching, board interactions, strategic leadership

#### Peer Coaching (Coaching Colleagues)
- **`peer_collaboration`** - Cross-functional teamwork, project partnerships
- **`lateral_influence`** - Influencing without authority, peer leadership
- **`knowledge_sharing`** - Collaborative learning, skill exchange

#### Downward Coaching (Coaching Subordinates)
- **`team_leadership`** - Direct report management, team development
- **`coaching_skills`** - Becoming a coach, developing others
- **`delegation_coach`** - Effective delegation, empowerment, growth facilitation

#### External Coaching
- **`client_coaching`** - Coaching external clients, customer success
- **`vendor_coaching`** - Supplier relationships, contractor management
- **`community_coaching`** - Industry leadership, thought leadership

## Playbook Weighting System

### Weight Categories
- **Primary Weight**: 40-80% - Main coaching focus
- **Secondary Weight**: 20-40% - Supporting coaching elements
- **Tertiary Weight**: 5-20% - Contextual or situational coaching
- **Intervention Weight**: 0-100% - Temporary focus for specific needs

### Example Configurations
```
Marketing Campaign Launch:
- marketing_coach: 60%
- productivity_coach: 25%
- stress_management: 15%

Career Transition:
- career_coaching: 50%
- networking_coach: 30%
- confidence_coach: 20%

Technical Leadership:
- engineering_coach: 45%
- leadership_coach: 35%
- communication_coach: 20%
```

## Company-Specific Playbooks

### Organizational Coaching
- **`[company_name]_coach`** - Company-specific coaching (e.g., `ckdelta_coach`)
- **`industry_coach`** - Industry-specific coaching (e.g., `fintech_coach`)
- **`culture_coach`** - Company culture integration, values alignment

### Hierarchical Coaching
- **`C_level_coach`** - Executive-level coaching
- **`management_coach`** - Middle management coaching
- **`individual_contributor`** - IC-level coaching
- **`new_hire_coach`** - Onboarding and integration coaching

## Integration with Quest Features

### Repository Integration
All coaches have access to:
- User's professional repository
- Previous coaching sessions
- Skills assessments
- Goal tracking
- Performance metrics

### Real-Time Context
Coaches adapt to:
- Current conversation context
- Emotional state (via Hume AI)
- Recent activities
- Industry news and trends
- Company developments

### Voice & Personality
Each coach has:
- Distinct voice characteristics
- Unique speaking patterns
- Specialized vocabulary
- Consistent personality traits
- Expertise-specific knowledge

## Usage Guidelines

### When to Use Multiple Coaches
1. **Complex Challenges**: Multi-faceted problems requiring different expertise
2. **Skill Gaps**: When primary coach identifies need for specialist support
3. **Stagnation**: When progress stalls and fresh perspective is needed
4. **User Request**: When user explicitly asks for additional coaching

### Coach Handoff Protocols
1. **Context Preservation**: Full conversation history transferred
2. **Goal Alignment**: Shared understanding of objectives
3. **Smooth Transitions**: Natural introduction and explanation
4. **Collaborative Approach**: Coaches work together, not independently

### Effectiveness Metrics
- **Session Completion Rate**: Users finishing coaching sessions
- **Goal Achievement**: Users reaching stated objectives
- **User Satisfaction**: Ratings and feedback
- **Engagement Level**: Time spent, return visits, recommendation usage

---

*This registry is maintained by the Quest AI Platform team and updated as new coaching capabilities are added.*