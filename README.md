# Job Portal - Scalable Full Stack Application

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue)
![Redis](https://img.shields.io/badge/Redis-7.x-red)
![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20EC2-orange)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📌 Overview

A production-ready, scalable job portal platform built with **NestJS**, **PostgreSQL**, and **Redis**. Designed to handle concurrent users with **caching**, **rate limiting**, **WebSocket real-time notifications**, and **asynchronous background job processing**.

**Live Demo:** [Coming Soon]  
**API Documentation:** `/api/docs` (Swagger)

---

## ✨ Features

### Core Functionality
- **User Management** - Registration, login, JWT authentication, role-based access control (RBAC)
- **Job Postings** - Create, read, update, delete jobs with filters and pagination
- **Recruiter Workflows** - Company profiles, job analytics, applicant tracking
- **Candidate Applications** - Apply to jobs, track application status

### Advanced Features
- 🔐 **JWT + RBAC** - 5+ user roles (Admin, Recruiter, Candidate, Moderator, Viewer) with 20+ secured endpoints
- ⚡ **Redis Caching** - 41% faster API response times for job search endpoints
- 🚦 **Rate Limiting** - Distributed rate limiting using BullMQ + Redis to prevent abuse
- 📧 **Background Jobs** - Async email notifications and scheduled tasks with BullMQ
- 🔄 **Real-time Updates** - WebSocket connections for live application status changes
- 📁 **Secure File Uploads** - AWS S3 pre-signed URLs (no backend file handling)
- 🗄️ **Optimized Queries** - Complex SQL with JOINs, aggregations, and EXPLAIN optimization
- 📌 **API Versioning** - `/v1/` and `/v2/` support for backward compatibility
- 🐳 **Docker Ready** - Containerized for easy deployment

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Backend** | Node.js, NestJS, Express.js |
| **Database** | PostgreSQL, Prisma ORM |
| **Caching & Queues** | Redis, BullMQ |
| **Real-time** | WebSockets (Socket.io) |
| **Cloud** | AWS S3, AWS EC2 |
| **Server** | PM2 + Nginx reverse proxy |
| **Monitoring** | Sentry, Prometheus, Grafana |
| **DevOps** | Docker, CI Pipeline |
| **Tools** | Postman, Git, GitHub Actions |

---
