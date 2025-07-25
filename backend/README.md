# Quick Commerce Platform

Enterprise-grade Quick Commerce Platform built with Node.js, Express.js, and MongoDB.

## Features
- Multi-role system (Admin, Sub-Admin, Restaurant Owner, Delivery Personnel, Customer)
- Real-time order tracking
- Queue-based order processing
- File upload with Cloudinary
- Redis caching
- JWT authentication
- API documentation with Swagger

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Redis
- **Queue:** Bull Queue
- **Real-time:** Socket.io
- **File Storage:** Cloudinary
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI
- **Deployment:** Docker

## Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Update .env with your credentials
5. Start development server: `npm run dev`

## Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
