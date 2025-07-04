#!/bin/bash

# Quest Git Hooks Setup
# Installs pre-commit hooks for Quest principle validation

echo "🔧 Setting up Quest development hooks..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Quest Pre-Commit Validation
echo "🔍 Running Quest principle validation (advisory mode)..."

# Set default to advisory mode if not specified
export QUEST_VALIDATION_MODE=${QUEST_VALIDATION_MODE:-advisory}

# Run the validation using tsx directly (faster than compiling)
npx tsx .quest/pre-commit-validation.ts

# Capture exit code
VALIDATION_RESULT=$?

# Exit with validation result (advisory mode always allows commits)
if [ $VALIDATION_RESULT -ne 0 ]; then
    echo ""
    if [ "$QUEST_VALIDATION_MODE" = "advisory" ]; then
        echo "💡 Advisory mode: Recommendations shown above, but commit proceeding"
        echo ""
        echo "🔒 To enable strict mode: QUEST_VALIDATION_MODE=strict git commit"
        echo "🚨 For emergencies: git commit --no-verify"
        echo ""
        exit 0
    else
        echo "❌ Commit blocked due to principle violations."
        echo "   Fix the issues above and try again."
        echo ""
        echo "💡 Escape hatches:"
        echo "   Emergency mode: QUEST_VALIDATION_MODE=emergency git commit"
        echo "   Skip validation: git commit --no-verify"
        echo ""
        exit 1
    fi
fi

echo "✅ All Quest principles validated. Proceeding with commit..."
exit 0
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create pre-push hook for additional checks
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🚀 Running pre-push validation..."

# Run full test suite
echo "Running tests..."
npm test -- --passWithNoTests --watchAll=false

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Push blocked."
    exit 1
fi

# Run build to ensure everything compiles
echo "Testing build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Push blocked."
    exit 1
fi

echo "✅ Pre-push validation passed!"
exit 0
EOF

# Make pre-push hook executable
chmod +x .git/hooks/pre-push

echo "✅ Quest hooks installed successfully!"
echo ""
echo "📋 Installed hooks:"
echo "   • pre-commit: Validates Quest principles (advisory mode)"
echo "   • pre-push: Runs tests and build"
echo ""
echo "🎯 Validation modes:"
echo "   • Default (advisory): Shows recommendations, never blocks"
echo "   • Emergency: QUEST_VALIDATION_MODE=emergency git commit"
echo "   • Strict: QUEST_VALIDATION_MODE=strict git commit"
echo ""
echo "💡 Manual validation:"
echo "   npm run validate            # Advisory mode"
echo "   npm run validate:emergency  # Emergency mode"
echo "   npm run validate:strict     # Strict mode"
echo ""
echo "🚨 Emergency bypass (use sparingly):"
echo "   git commit --no-verify"
echo ""