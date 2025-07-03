# Documentation Overview

This directory contains comprehensive documentation for Pinref, a modern visual bookmark manager built with Next.js and AWS serverless infrastructure.

## Quick Navigation

### 📚 Understanding Pinref

1. **[Project Overview](./project-overview.md)** - Vision, features, and business model
2. **[Business Logic](./business-logic.md)** - Core features and domain entities  
3. **[Technical Architecture](./technical-architecture.md)** - System design and infrastructure
4. **[Search Implementation](./search-implementation.md)** - N-gram search algorithm details

### 🚀 Getting Started

1. **[Development Summary](./development-summary.md)** - Project status and next steps
2. **[Development Setup](./development-setup.md)** - Local development environment
3. **[AWS Deployment Guide](./aws-deployment.md)** - Step-by-step AWS setup and deployment
4. **[Environment Guide](./deployment-vs-runtime-environment.md)** - Understanding SST environments

### 🏗️ Technical Deep Dive

1. **[Architecture Overview](./architecture.md)** - AWS infrastructure and OpenNext integration

## Documentation Focus

This documentation provides comprehensive coverage of Pinref's architecture, business logic, and implementation details:

### Business & Product
- **Project Vision**: Understanding Pinref's goals and target users
- **Feature Set**: Detailed breakdown of bookmark management capabilities
- **Business Model**: Potential monetization and scaling strategies

### Technical Implementation
- **System Architecture**: Serverless AWS infrastructure design
- **Data Model**: DynamoDB single-table design and entity relationships
- **Search Engine**: Advanced n-gram based fuzzy search implementation
- **Security**: Data encryption and user privacy measures

### Development & Deployment
- **Local Setup**: Development environment configuration
- **AWS Infrastructure**: Serverless deployment with SST
- **Performance**: Optimization strategies and monitoring
- **Testing**: Quality assurance and testing approaches

### What's Not Covered

Generic topics are covered in official docs:

- General Next.js features → [Next.js docs](https://nextjs.org/docs)
- React fundamentals → [React docs](https://react.dev/)
- Basic TypeScript → [TypeScript docs](https://www.typescriptlang.org/docs/)

## Recent Updates (January 2025)

### ✅ Complete Project Transformation

- **Evolved from Starter to Full Application**: Transformed from a basic Next.js SST starter into a sophisticated bookmark manager
- **Comprehensive Documentation**: Added detailed business logic, technical architecture, and search implementation docs
- **DynamoDB Integration**: Replaced any remaining Prisma references with DynamoDB operations
- **Advanced Search**: Implemented and documented n-gram based fuzzy search system
- **Security Implementation**: Added data encryption and user privacy measures
- **Type Safety**: Full TypeScript implementation with proper interfaces and type definitions

### 🔄 Architecture Improvements

- **Single-Table Design**: Optimized DynamoDB schema for scalability and performance
- **Serverless Optimization**: ARM64 Lambda functions for cost efficiency
- **Search Performance**: Pre-computed n-gram tokens for fast fuzzy search
- **Data Encryption**: Field-level encryption for sensitive bookmark data

---

📚 **Current Stack**: Next.js 15 | React 19 | TypeScript | DynamoDB | AWS Lambda | SST 3.17+ | Node.js 20.x
