#!/bin/bash
# Railway deployment script for Mission Control

echo "🚀 Deploying Mission Control to Railway..."

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in. Run: railway login --browserless"
    exit 1
fi

# Initialize project if not already
if [ ! -f .railway/config.json ]; then
    echo "📦 Initializing Railway project..."
    railway init --name mission-control
fi

# Deploy
echo "📤 Uploading and deploying..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run: railway open (to open dashboard)"
echo "2. Add environment variables in Railway dashboard"
echo "3. Your app will be available at the URL shown"
