# Pinref - Visual Bookmark Manager

A modern, secure, and intelligent bookmark management application built with Next.js and serverless AWS infrastructure using SST (Serverless Stack).

## Features

- **� Visual Bookmark Management**: Rich visual cards with automatic metadata extraction

  - Automatic title, description, and image extraction
  - Favicon and domain recognition
  - Favorites system for important bookmarks
  - Responsive card-based interface

- **🏷️ Smart Organization**:

  - Categories with custom icons and colors
  - Flexible tagging system
  - Filter by category, tags, or favorites
  - Real-time bookmark counts

- **� Advanced Search**:

  - N-gram based fuzzy search
  - Typo-tolerant search queries
  - Partial and autocomplete matching
  - Multi-field search (title, description, domain)

- **🔐 Security & Privacy**:

  - End-to-end encryption of sensitive data
  - User data isolation
  - No tracking or external analytics
  - GDPR-compliant design

- **☁️ Serverless Infrastructure**:

  - AWS DynamoDB for scalable data storage
  - Lambda functions for serverless compute
  - CloudFront CDN for global performance
  - SST for infrastructure as code

- **🛠️ Developer Experience**:
  - TypeScript for full type safety
  - Modern React with Next.js App Router
  - Tailwind CSS with shadcn/ui components
  - Comprehensive documentation

## Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ and npm
- GitHub repository (GitHub Pro required for environment secrets)
- Docker Desktop (Windows users only)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd pinref
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your AWS configuration
   ```

3. **Start development server:**

   ```bash
   ./start-local-sso.sh  # Recommended: Handles AWS SSO and starts dev server
   ```

   > **⚠️ Important**: Use the SSO script for proper AWS authentication. The script automatically detects your AWS SSO profile. Running `npm run dev` directly won't have AWS credentials.

## Documentation

- **📖 [Project Overview](./docs/project-overview.md)** - Vision, features, and business model
- **🏗️ [Technical Architecture](./docs/technical-architecture.md)** - System design and infrastructure
- **💼 [Business Logic](./docs/business-logic.md)** - Core features and domain entities
- **🔍 [Search Implementation](./docs/search-implementation.md)** - N-gram search algorithm details
- **🚀 [AWS Deployment](./docs/aws-deployment.md)** - Complete AWS setup and deployment guide
- **🔧 [Development Setup](./docs/development-setup.md)** - Local development environment
- **📚 [Architecture Overview](./docs/architecture.md)** - AWS infrastructure details

## AWS Deployment

```bash
npx sst deploy --stage dev  # Deploy to development
npx sst deploy --stage prod # Deploy to production
```

> **📋 For complete AWS setup and configuration**, see [AWS Deployment Guide](./docs/aws-deployment.md)

## Key Features & Edge Cases

### Lambda Warming Optimization

- **Issue**: Default SST warming causes cold starts
- **Solution**: Custom `warmer.js` script with 1-minute intervals (see [SST #5534](https://github.com/sst/sst/issues/5534))
- **Usage**: Update domain and run `node warmer.js` for production

### Contact Form with SES

- AWS SES integration for email delivery
- Email verification required after deployment
- Configuration details in [AWS Deployment Guide](./docs/aws-deployment.md)

### Environment Management

- Deployment environments: `dev` vs `prod` stages
- Runtime environments: `development` vs `production`
- Utilities in `src/lib/env.utils.ts` for type-safe environment handling

> **📖 For detailed environment concepts**, see [Environment Guide](./docs/deployment-vs-runtime-environment.md)

## Project Structure

```
├── docs/                   # Detailed documentation
├── src/
│   ├── app/               # Next.js App Router + API routes
│   ├── components/        # React components + shadcn/ui
│   ├── lib/              # Utilities (env.utils.ts, etc.)
│   ├── schemas/          # Zod validation schemas
│   └── typings/          # TypeScript definitions (sst-env.d.ts)
├── warmer.js             # Lambda warming script (1-min intervals)
├── sst.config.ts         # Infrastructure as Code
└── start-local-sso.sh    # Development server with AWS SSO
```

> **⚠️ Build Limitation**: Stop `start-local-sso.sh` before running build commands, as it locks the terminal session.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit with meaningful messages
6. Submit a pull request

## Scripts

```bash
./start-local-sso.sh     # Start with AWS SSO (recommended)
npm run build           # Build for production (stop SSO script first)
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Type checking
node warmer.js          # Keep Lambda warm (production)
```

## Support

- [SST Documentation](https://docs.sst.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

Built with ❤️ using Next.js, SST, and AWS
