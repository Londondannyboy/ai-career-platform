# Quest Pragmatic Validation System

## 🎯 Philosophy: Quality with Velocity

The Quest validation system is designed to maintain high code quality while preserving development velocity. It provides **guidance and recommendations** rather than rigid blocking, with clear escape hatches for legitimate emergencies.

## 🚦 Validation Modes

### **Advisory Mode (Default)** 💡
- **Purpose**: Show recommendations, never block commits
- **Best for**: Daily development, learning, building confidence
- **Behavior**: Displays warnings and suggestions but always allows commits

```bash
# Default mode - advisory
git commit -m "feature: add new component"

# Explicit advisory mode
QUEST_VALIDATION_MODE=advisory git commit -m "update: fix styling"
```

### **Emergency Mode** 🚨
- **Purpose**: Minimal validation for urgent situations
- **Best for**: Hotfixes, production emergencies, critical patches
- **Behavior**: Only checks security and TypeScript errors

```bash
# Emergency mode for urgent fixes
QUEST_VALIDATION_MODE=emergency git commit -m "hotfix: critical security patch"
```

### **Strict Mode** 🔒
- **Purpose**: Enforce all principles strictly
- **Best for**: Pre-release, important milestones, mature teams
- **Behavior**: Blocks commits that violate any principle

```bash
# Strict mode for important commits
QUEST_VALIDATION_MODE=strict git commit -m "release: prepare v2.0.0"
```

## 🚪 Escape Hatches

### **Automatic Escapes** (No additional flags needed)
```bash
# These commit messages automatically skip validation
git commit -m "hotfix: production issue"
git commit -m "emergency: server down"
git commit -m "wip: work in progress"
git commit -m "temp: temporary changes"
```

### **Manual Overrides**
```bash
# Complete bypass (use sparingly)
git commit --no-verify -m "override validation"

# Mode-specific overrides
QUEST_VALIDATION_MODE=emergency git commit -m "urgent fix"
```

### **Branch-based Escapes**
- Branches starting with `hotfix/`, `emergency/`, or `temp/` automatically skip validation

## 📋 Available Commands

### **Manual Validation**
```bash
# Test different modes without committing
npm run validate              # Advisory mode
npm run validate:advisory     # Explicit advisory
npm run validate:emergency    # Emergency mode  
npm run validate:strict       # Strict mode
```

### **Setup & Configuration**
```bash
# Install Git hooks
npm run validate:setup

# Check current principles
npm run principles:check
```

## 🛠️ Installation & Setup

### **1. Install the System**
```bash
npm run validate:setup
```

### **2. Test the Installation**
```bash
# Test in advisory mode (safe)
npm run validate:advisory
```

### **3. Make Your First Commit**
```bash
# This will show recommendations but allow the commit
git add .
git commit -m "test: validate setup"
```

## 🎯 Progressive Adoption Strategy

### **Phase 1: Advisory (Weeks 1-2)**
- All commits allowed, recommendations shown
- Team learns principles without friction
- Build confidence with the system

### **Phase 2: Selective (Weeks 3-4)**
- Critical paths validated strictly
- Non-critical paths remain advisory
- Gradual introduction of enforcement

### **Phase 3: Strict (Month 2+)**
- Full principle enforcement
- Team comfortable with standards
- Maximum quality assurance

## 🔧 Configuration Options

### **Environment Variables**
```bash
# Set default mode
export QUEST_VALIDATION_MODE=advisory

# Temporary mode for single commit
QUEST_VALIDATION_MODE=strict git commit -m "important change"
```

### **Performance Settings**
- **Timeout**: 30 seconds (configurable)
- **File Limit**: 50 files max per validation
- **Changed Files Only**: Only validates modified files

## 📊 What Gets Validated

### **Always Enabled** (Even in Emergency Mode)
- ✅ **Security**: No exposed secrets, SQL injection prevention
- ✅ **TypeScript**: Basic compilation errors

### **Advisory Mode Checks**
- 💡 **Modularity**: Component interface patterns
- 💡 **Testing**: Test coverage recommendations
- 💡 **Accessibility**: WCAG compliance suggestions
- 💡 **Performance**: Bundle size impact warnings
- 💡 **Documentation**: JSDoc comment recommendations

### **Strict Mode Enforcement**
- ❌ **All Principles**: Full enforcement of all 14 principles
- ❌ **No Warnings**: Warnings become blocking errors

## 🚨 Emergency Scenarios

### **Production Hotfix**
```bash
# Option 1: Use emergency mode
QUEST_VALIDATION_MODE=emergency git commit -m "hotfix: critical bug"

# Option 2: Use automatic escape
git commit -m "hotfix: fix authentication issue"

# Option 3: Complete bypass (last resort)
git commit --no-verify -m "emergency: restore service"
```

### **Urgent Feature**
```bash
# Minimal validation but still some safety
QUEST_VALIDATION_MODE=emergency git commit -m "urgent: client demo feature"
```

### **Experimental Work**
```bash
# Work-in-progress commits
git commit -m "wip: experimenting with new approach"
```

## 📈 Success Metrics

### **Adoption Success**
- ✅ <30 second commit time overhead
- ✅ <10% `--no-verify` usage (emergency overrides)
- ✅ 90%+ developer satisfaction with recommendations
- ✅ Gradual progression from advisory to strict mode

### **Quality Improvements**
- ✅ Fewer bugs in code review
- ✅ More consistent component patterns
- ✅ Better accessibility compliance
- ✅ Improved documentation coverage

## 🔄 Migration from Legacy Systems

### **If You Have Existing Hooks**
```bash
# Backup existing hooks
cp .git/hooks/pre-commit .git/hooks/pre-commit.backup

# Install Quest hooks
npm run validate:setup

# Restore custom logic if needed
```

### **If You Have Strict Linting**
```bash
# Start in advisory mode to avoid friction
QUEST_VALIDATION_MODE=advisory npm run validate:setup

# Gradually tighten when team is ready
```

## 💡 Best Practices

### **For Daily Development**
1. Use default advisory mode
2. Pay attention to recommendations
3. Fix issues when convenient, not immediately
4. Use emergency mode for genuine urgencies

### **For Important Releases**
1. Switch to strict mode for release commits
2. Ensure all principles are followed
3. Use manual validation before committing

### **For Team Onboarding**
1. Start new developers in advisory mode
2. Explain the principles and reasoning
3. Gradually introduce stricter validation
4. Show escape hatches for legitimate needs

## 🎉 Success Stories

The pragmatic approach ensures that:
- **Developers stay productive** during urgent situations
- **Quality gradually improves** through consistent recommendations
- **Team confidence builds** with non-blocking guidance
- **Emergency situations are handled** without breaking workflow

This system transforms code quality from a **barrier** into a **guide**, helping teams write better code without sacrificing velocity or flexibility.