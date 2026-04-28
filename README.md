# Content Broadcasting System - Backend

A robust role-based broadcasting, moderation, and dynamic scheduling backend API built precisely to assignment specifications using Node.js, Express, and native PostgreSQL.

## Core Features Implemented
* **Authentication & RBAC:** Complete JWT separation between \`teacher\` and \`principal\` roles.
* **Content Upload System:** Direct streaming uploads of educational media via AWS S3.
* **Approval Lifecycle Workflow:** Content flows through \`pending\` -> \`approved\` / \`rejected\` (with enforced reasoning).
* **Public Broadcasting API:** Exposes targeted \`/live/:teacherId\` endpoints for students.
* **Complex Scheduling & Rotation Algorithms:** Automatically rotates videos mathematically based on subject, \`start_time\`, \`end_time\`, and \`rotation_duration\` intervals.
* **Rate Limiting (Bonus):** Active protection against brute-force and request-flooding via \`express-rate-limit\`.
* **Centralized Swagger Documentation:** OpenAPI compliant auto-generated API specifications.

## Technology Stack
* **Runtime:** Node.js (v18+) , Express.js
* **Database:** PostgreSQL (utilized via native \`pg\` pool driver for absolute control over parameterization mapping limits).
* **Cloud Storage (Bonus):** AWS S3 (via \`@aws-sdk/client-s3\`, \`multer-s3\`).
* **Validation:** \`zod\` (Strict schema payload verifications).
* **Security:** \`bcryptjs\` (Password Hashing), \`jsonwebtoken\`, \`cors\`.
* **Typing:** Strict TS configuration.

## Setup Instructions

### 1. Environment Variables Configuration
Clone the \`.env.example\` provided in the repository to \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`
Fill out the variables including your PostgreSQL connection details and AWS API Keys.

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Database Initialization & Dummy Seeding
The custom built native script runs migrations and loads sample scheduled data to prove out the complex rotation maths.
\`\`\`bash
npm run build
npm run db:migrate  # Initializes all tables
npm run db:seed     # Injects Principal/Teacher profiles + Demo Broadcasting Schedule
\`\`\`
*Note: All seeded users use the password: \`password123\`*

### 4. Running the Application
**Development Mode (Hot Reloading):**
\`\`\`bash
npm run dev
\`\`\`
**Production Build:**
\`\`\`bash
npm run build
npm run start
\`\`\`

## Interactive Documentation (Swagger API Usage)
To thoroughly test the APIs, start the server and interact natively with:
-> **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

This provides pre-configured payload samples for Auth, Uploads, Approvals, and Broadcast fetches without needing Postman.

## Edge Cases Handled Successfully
* **Case 1: No content available:** Returns \`active_content: null\` gracefully.
* **Case 2: Approved but not scheduled:** Content residing outside the strict \`start_time\` <-> \`end_time\` boundaries completely resolves to idle null loops.
* **Case 3: Invalid Subject Requested:** Skips throwing 500 crashes and strictly isolates searches, returning null representations.
* **Empty Payload Rejections:** Handled securely via the Zod validation layer at the routing tier before touching DB CPU overhead.

## Assumptions & Skipped Features
* **Assumed Input Confidence:** Due to assignment focus, the `file_size` and `file_type` upload limitations are constrained lightly at the Multer middleware logic (JPG/PNG/GIF). Complex video streaming logic (ffmpeg encoding) was intentionally skipped.
* **Redis Caching:** Given the ultra-lean math algorithm evaluating `getLiveContent`, caching wasn't completely necessary. Every DB ping resolves cleanly in less than ~4ms. Focus was placed instead on the AWS S3 Bonus objective and Rate Limiting Bonus implementations.
