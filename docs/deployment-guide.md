# Deployment Guide

This guide covers the complete deployment process for Pinref, including environment setup, secrets management, and CI/CD configuration.

## Prerequisites

- AWS Account with appropriate permissions
- Domain name registered and managed in Route 53
- GitHub repository with GitHub Actions enabled
- Node.js 20+ and npm installed locally

## Environment Setup

### 1. Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd pinref
   npm install
   ```

2. **Create local environment file:**

   ```bash
   cp .env.example .env.local
   ```

3. **Configure .env.local for development:**

   ```bash
   # AWS Configuration (for local development)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_local_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_local_aws_secret_key

   # Database Configuration
   DYNAMODB_TABLE_NAME=pinref-bookmark-table-dev

   # Authentication Configuration
   NEXTAUTH_SECRET=your_32_character_secret_for_local_dev
   NEXTAUTH_URL=http://localhost:3000

   # OAuth Providers (get from respective platforms)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # Security Configuration
   ENCRYPTION_KEY=your_32_character_encryption_key

   # Development settings
   DEPLOYMENT_ENV=development
   NODE_ENV=development
   ```

### 2. AWS Infrastructure Setup

The SST configuration in `sst.config.ts` will create:

- **DynamoDB Table**: Single-table design for all entities
- **SES Email Service**: For notifications and contact forms
- **CloudFront Distribution**: Global CDN
- **Lambda Functions**: Serverless compute
- **Route 53 DNS**: Domain management

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

### Repository Settings > Secrets and Variables > Actions

#### Required for All Environments

```
AWS_ACCESS_KEY_ID          # AWS access key for deployment
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployment
AWS_REGION                 # AWS region (e.g., us-east-1)
```

#### Production Environment Secrets

```
NEXTAUTH_SECRET           # 32+ character random string
ENCRYPTION_KEY           # 32+ character encryption key
GOOGLE_CLIENT_ID         # Google OAuth client ID
GOOGLE_CLIENT_SECRET     # Google OAuth client secret
GITHUB_CLIENT_ID         # GitHub OAuth client ID
GITHUB_CLIENT_SECRET     # GitHub OAuth client secret
```

#### Development Environment Secrets (with \_DEV suffix)

```
NEXTAUTH_SECRET_DEV      # Different secret for dev
ENCRYPTION_KEY_DEV       # Different encryption key for dev
GOOGLE_CLIENT_ID_DEV     # Dev OAuth credentials
GOOGLE_CLIENT_SECRET_DEV
GITHUB_CLIENT_ID_DEV
GITHUB_CLIENT_SECRET_DEV
```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure authorized domains:
   - **Development**: `http://localhost:3000`
   - **Production**: `https://pinref.com`
6. Set authorized redirect URIs:
   - **Development**: `http://localhost:3000/api/auth/callback/google`
   - **Production**: `https://pinref.com/api/auth/callback/google`

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Configure settings:
   - **Application name**: Pinref
   - **Homepage URL**: `https://pinref.com`
   - **Authorization callback URL**: `https://pinref.com/api/auth/callback/github`
4. Create separate app for development with callback: `http://localhost:3000/api/auth/callback/github`

## Deployment Process

### Manual Deployment

1. **Deploy Development Environment:**

   ```bash
   npx sst deploy --stage dev
   ```

2. **Deploy Production Environment:**
   ```bash
   npx sst deploy --stage prod
   ```

### Automated Deployment via GitHub Actions

#### Development Deployment

- **Trigger**: Push to `main` branch
- **Environment**: `dev`
- **URL**: `https://dev.pinref.com`

#### Production Deployment

- **Trigger**: Manual workflow dispatch
- **Environment**: `prod`
- **URL**: `https://pinref.com`

### Setting Up Secrets via CLI

You can also set secrets manually using SST CLI:

```bash
# Production secrets
npx sst secret set AuthSecret "your-32-char-secret" --stage prod
npx sst secret set EncryptionKey "your-32-char-key" --stage prod
npx sst secret set GoogleClientId "your-google-id" --stage prod
npx sst secret set GoogleClientSecret "your-google-secret" --stage prod
npx sst secret set GithubClientId "your-github-id" --stage prod
npx sst secret set GithubClientSecret "your-github-secret" --stage prod

# Development secrets
npx sst secret set AuthSecret "your-dev-secret" --stage dev
npx sst secret set EncryptionKey "your-dev-key" --stage dev
# ... etc for other secrets
```

## Domain Configuration

### Route 53 Setup

1. **Register domain** in Route 53 or transfer existing domain
2. **Update hosted zone ID** in `sst.config.ts`:
   ```typescript
   dns: sst.aws.dns({
     zone: "YOUR_HOSTED_ZONE_ID", // Replace with your zone ID
   }),
   ```

### SSL Certificate

SST automatically provisions SSL certificates via AWS Certificate Manager when you deploy with a custom domain.

## Monitoring and Maintenance

### CloudWatch Logs

Monitor application logs in AWS CloudWatch:

- Lambda function logs
- DynamoDB access patterns
- Email delivery logs

### DynamoDB Monitoring

Key metrics to monitor:

- Read/Write capacity units
- Throttled requests
- Item count growth
- GSI performance

### Cost Monitoring

Set up AWS billing alerts for:

- DynamoDB usage
- Lambda invocations
- CloudFront data transfer
- SES email sending

## Troubleshooting

### Common Deployment Issues

1. **Domain not resolving:**

   - Check Route 53 hosted zone configuration
   - Verify DNS propagation (can take up to 48 hours)

2. **OAuth not working:**

   - Verify callback URLs match exactly
   - Check client ID/secret configuration
   - Ensure secrets are set correctly

3. **DynamoDB connection issues:**
   - Verify IAM permissions
   - Check AWS credentials configuration
   - Confirm table name matches environment

### Environment-specific Issues

#### Development

- Use `DYNAMODB_ENDPOINT=http://localhost:8000` for local DynamoDB
- Ensure `.env.local` is not committed to git

#### Production

- Monitor CloudWatch for errors
- Check SST resource linking
- Verify all secrets are set

## Security Considerations

### Data Protection

- All sensitive bookmark data is encrypted at rest
- Environment variables stored securely in GitHub secrets
- AWS IAM permissions follow least privilege principle

### Access Control

- OAuth providers for authentication
- User data isolation in DynamoDB
- Secure session management with NextAuth

### Compliance

- GDPR-compliant data handling
- User data export/deletion capabilities
- Audit logging for security events

---

This deployment guide ensures a secure, scalable deployment of Pinref with proper environment separation and monitoring.
