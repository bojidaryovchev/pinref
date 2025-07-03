# Technical Architecture & Implementation

## System Architecture

Pinref follows a modern serverless architecture pattern built on AWS, designed for scalability, performance, and cost-effectiveness.

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │────│   CloudFront     │────│   Lambda@Edge   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   S3 Bucket      │    │   Next.js App   │
                       │ (Static Assets)  │    │   (Lambda)      │
                       └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   DynamoDB      │
                                                │ (Single Table)  │
                                                └─────────────────┘
```

### Technology Stack

#### Frontend
- **Next.js 15**: React framework with App Router for modern web development
- **React 19**: Latest React with concurrent features and enhanced performance
- **TypeScript**: Full type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **shadcn/ui**: High-quality React components built on Radix UI

#### Backend
- **Next.js API Routes**: Serverless API endpoints
- **AWS Lambda**: Serverless compute for API and SSR
- **DynamoDB**: NoSQL database for scalable data storage
- **AWS SES**: Email service for notifications and contact forms

#### Infrastructure
- **SST (Serverless Stack)**: Infrastructure as Code for AWS
- **AWS CloudFront**: Global CDN for fast content delivery
- **AWS S3**: Static asset storage
- **AWS IAM**: Identity and access management

#### Developer Experience
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality
- **TypeScript**: Static type checking

## Data Architecture

### DynamoDB Single-Table Design

Pinref uses a single-table design pattern for optimal performance and cost efficiency:

```
Primary Key (PK)           Sort Key (SK)              Entity Type
USER#user-id              USER                        User Profile
BOOKMARK#bookmark-id      BOOKMARK                    Bookmark
CATEGORY#category-id      CATEGORY                    Category
TAG#tag-id               TAG                         Tag

GSI1PK (User ID)         GSI1SK (Entity + Date)     Access Pattern
USER#user-id             BOOKMARK#2024-01-15        User's Bookmarks (by date)
USER#user-id             CATEGORY#2024-01-10        User's Categories
USER#user-id             TAG#2024-01-12             User's Tags
```

### Key Benefits
- **Single Query Access**: All related data accessible in single queries
- **Cost Efficient**: Pay only for what you read/write
- **Scalable**: Handles millions of records without performance degradation
- **Consistent Performance**: Predictable latency regardless of data size

### Entity Relationships

```
User (1) ─────────── (N) Bookmark
  │                     │
  │                     │
  ├── (N) Category ─────┤
  │                     │
  └── (N) Tag ──────────┘
```

## Search Implementation

### N-gram Based Search Engine

Pinref implements a sophisticated search system using n-gram tokenization for fuzzy matching:

#### Token Generation Strategy

```typescript
// Example: "React Tutorial"
generateSearchTokens("React Tutorial") produces:

// Character n-grams
["R", "Re", "Rea", "Reac", "React", "T", "Tu", "Tut", "Tuto", "Tutor", ...]

// Word n-grams  
["React", "Tutorial", "React Tutorial"]

// Cross-word n-grams
["t T", "ct Tu", "act Tut", ...]
```

#### Search Process

1. **Indexing**: When bookmarks are created, generate comprehensive n-grams from:
   - Title
   - Description  
   - Domain
   - URL path

2. **Querying**: When users search, generate query tokens and match against stored n-grams

3. **Scoring**: Calculate relevance scores based on:
   - Exact matches (weight: 10)
   - Prefix matches (weight: 5) 
   - Partial matches (weight: 1)

4. **Ranking**: Return results sorted by relevance score

#### Advantages
- **Fuzzy Matching**: Finds results even with typos
- **Partial Queries**: Works with incomplete search terms
- **Fast Performance**: Pre-computed tokens enable quick lookups
- **Language Agnostic**: Works with any character set

### Example Search Scenarios

```
Query: "reac"
Matches: "React Tutorial", "React Documentation", "Creating React Apps"

Query: "js frame"  
Matches: "JavaScript Frameworks", "Node.js Framework Guide"

Query: "desgin" (typo)
Matches: "Design Patterns", "Web Design Tools"
```

## Security Implementation

### Data Encryption

#### Encryption at Rest
- **Field-Level Encryption**: Sensitive bookmark data encrypted before storage
- **AWS KMS**: Key management through AWS Key Management Service
- **Unique Keys**: Each user has isolated encryption context

#### Encryption in Transit
- **TLS 1.3**: All data transmission encrypted with latest TLS
- **HTTPS Only**: All endpoints enforce HTTPS
- **Certificate Pinning**: Enhanced security for API communications

#### Encrypted Fields
```typescript
// Before Encryption
{
  title: "My Private Bookmark",
  description: "Sensitive information here",
  url: "https://private-site.com/secret-page"
}

// After Encryption (stored in DynamoDB)
{
  title: "AES256_ENCRYPTED_DATA_HERE",
  description: "AES256_ENCRYPTED_DATA_HERE", 
  url: "AES256_ENCRYPTED_DATA_HERE",
  domain: "private-site.com", // Not encrypted for search
}
```

### Authentication & Authorization

#### NextAuth.js Integration
- **Multiple Providers**: Support for Google, GitHub, email/password
- **Session Management**: Secure JWT tokens with rotation
- **CSRF Protection**: Built-in CSRF attack prevention

#### User Isolation
- **Row-Level Security**: DynamoDB queries filtered by user ID
- **No Cross-User Access**: Impossible to access other users' data
- **Audit Logging**: All access attempts logged for security monitoring

## Performance Optimizations

### Frontend Performance
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Static Generation**: Pre-built pages for better performance
- **Client-Side Caching**: React Query for intelligent data caching

### Backend Performance
- **Connection Pooling**: Reuse database connections across Lambda invocations
- **Query Optimization**: Single-table design minimizes query complexity
- **Compression**: Gzip compression for all responses
- **CDN Caching**: Static assets cached globally via CloudFront

### Database Performance
- **Single-Table Design**: Minimizes cross-table joins
- **Global Secondary Indexes**: Optimized access patterns
- **Batch Operations**: Bulk operations for better throughput
- **Connection Reuse**: Long-lived connections across Lambda invocations

## Monitoring & Observability

### Application Monitoring
- **AWS CloudWatch**: Metrics, logs, and alerts
- **Lambda Insights**: Function performance monitoring  
- **X-Ray Tracing**: Request tracing across services
- **Custom Metrics**: Business-specific monitoring

### Key Metrics Tracked
- **Response Time**: API endpoint performance
- **Error Rate**: Application error tracking
- **User Activity**: Feature usage and engagement
- **Cost Tracking**: AWS service costs and optimization opportunities

### Alerting Strategy
- **Critical Alerts**: System downtime, security issues
- **Warning Alerts**: Performance degradation, cost spikes
- **Info Alerts**: Usage milestones, deployment notifications

## Deployment Strategy

### Environment Management
- **Development**: Local development with DynamoDB Local
- **Staging**: AWS staging environment for testing
- **Production**: Multi-region production deployment

### CI/CD Pipeline
```
Code Commit → GitHub Actions → Tests → Build → Deploy → Smoke Tests
    │              │            │        │        │         │
    │              │            │        │        │         └── Rollback on Failure
    │              │            │        │        └── Blue/Green Deployment
    │              │            │        └── SST Deploy
    │              │            └── Unit + Integration Tests  
    │              └── Lint, Type Check, Security Scan
    └── Feature Branch → Pull Request → Code Review
```

### Deployment Features
- **Blue/Green Deployment**: Zero-downtime deployments
- **Automatic Rollback**: Failed deployments automatically revert
- **Feature Flags**: Gradual feature rollout capability
- **Database Migrations**: Safe, reversible schema changes

## Cost Optimization

### AWS Cost Management
- **ARM64 Lambda**: 34% cost savings over x86 Lambda
- **DynamoDB On-Demand**: Pay only for actual usage
- **CloudFront**: Reduced origin server load
- **S3 Intelligent Tiering**: Automatic cost optimization for static assets

### Estimated Costs (Monthly)
```
Light Usage (1,000 users, 10K bookmarks):
- Lambda: $5-10
- DynamoDB: $10-15  
- CloudFront: $5-10
- S3: $1-2
Total: ~$25-40/month

Heavy Usage (10,000 users, 100K bookmarks):
- Lambda: $50-75
- DynamoDB: $100-150
- CloudFront: $25-40
- S3: $5-10
Total: ~$200-300/month
```

---

This architecture provides a solid foundation for scaling Pinref from a small user base to enterprise-level usage while maintaining performance, security, and cost-effectiveness.
