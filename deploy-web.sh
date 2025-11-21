#!/bin/bash

# Scrum Poker - Web Deployment Script
# Deploys to AWS S3 + CloudFront

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-scrum-poker-web}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
AWS_REGION="${AWS_REGION:-eu-central-1}"

echo "🚀 Building for production..."
npm run build:web

echo "📦 Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync dist-web/ s3://$S3_BUCKET \
  --delete \
  --cache-control "max-age=31536000" \
  --exclude "index.html" \
  --exclude "sw.js" \
  --exclude "manifest.webmanifest"

# Upload index.html and SW files with no-cache
aws s3 cp dist-web/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

aws s3 cp dist-web/sw.js s3://$S3_BUCKET/sw.js \
  --cache-control "no-cache, no-store, must-revalidate"

aws s3 cp dist-web/manifest.webmanifest s3://$S3_BUCKET/manifest.webmanifest \
  --cache-control "no-cache, no-store, must-revalidate"

echo "✅ S3 upload complete"

# Invalidate CloudFront cache if distribution ID is set
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
  echo "✅ CloudFront invalidation started"
fi

echo "🎉 Deployment complete!"
