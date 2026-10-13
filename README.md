# Smart Pilot

Smart Pilot is an AI-powered business management platform and operating system designed for freelancers, entrepreneurs, and growing teams. The platform combines financial operations, invoicing, inventory management, customer relationship management, and task automation with a contextual AI Copilot powered by Google Gemini.

---

## Table of Contents

- Overview
- Architecture
- Core Features
- Technology Stack
- Project Directory Structure
- API Reference
- Environment Configuration
- Installation and Setup
- Subscription Tiers
- Security and Compliance
- Contributing
- Security Policy
- License

---

## Overview

Modern businesses often operate across fragmented tools for invoicing, task management, customer tracking, team communication, and artificial intelligence. Smart Pilot consolidates these operational capabilities into a single unified workspace.

Key capabilities include:
- Generating and exporting professional PDF invoices with dynamic tax and discount calculations.
- Tracking business performance through real-time financial dashboards and month-over-month growth metrics.
- Managing customer directories and linked transactional histories.
- Organizing product and service catalogs with stock tracking.
- Interacting with an AI Copilot that has access to live context from your invoices, tasks, customers, and inventory.
- Facilitating team collaboration through private channels and direct messaging for premium users.
- Enforcing strict multi-device concurrency control and remote session management.

---

## Architecture

Smart Pilot is architected as a decoupled client-server application:

```
[ Web Client: React 19 + Vite + Tailwind CSS ]
                       │
                       │ HTTP / REST / Bearer JWT
                       ▼
[ API Server: Express.js + Node.js (Port 5000) ]
        │                 │                 │
        │ Mongoose        │ REST / SDK      │ SMTP / REST
        ▼                 ▼                 ▼
[ MongoDB Database ]  [ Google Gemini ]  [ Third-Party Services ]
 - Users / Sessions    - Gemini 2.5 Flash  - Razorpay (Payments)
 - Invoices / Items                        - Cloudinary (Media)
 - Customers                               - Nodemailer (Email)
 - Products                                - OAuth (Google/GitHub/MS)
 - Tasks / Messages
```

### System Flow
1. **Client Layer**: A modern React single-page application built with Vite and Tailwind CSS. It manages authentication tokens, handles optimistic UI updates, and generates PDF invoices on the client side.
2. **API Layer**: An Express.js backend responsible for JWT verification, rate limiting, security headers, input sanitization, and business logic execution.
3. **Database Layer**: MongoDB stores business records with Mongoose schemas that enforce validation, indexes, and relationship references.
4. **Integration Services**:
   - Google Generative AI for real-time contextual copilot interactions.
   - Razorpay for order creation, payment checkout, and HMAC-SHA256 signature verification.
   - Cloudinary for secure avatar and media asset storage.
   - Nodemailer for 6-digit OTP delivery, welcome emails, and invoice dispatching.

---

## Core Features

### 1. Executive Dashboard and Analytics
- Real-time aggregation of total revenue, outstanding payments, paid invoice counts, and active tasks.
- Automated month-over-month percentage growth calculations for revenue, invoice volume, and projected cash flow.
- Interactive 7-day revenue comparison charts visualizing paid versus outstanding balances.
- Live workspace activity stream tracking recent payments, invoice generation, and system operations.

### 2. Invoicing Suite and Document Generation
- Visual invoice composition with customizable line items, quantities, rates, discount percentages, and taxes.
- Multi-currency support (INR, USD, EUR, GBP).
- High-fidelity PDF rendering and client-side export utilizing `html2pdf.js` and `html2canvas-pro`.
- Comprehensive invoice history table with status filters (Paid, Unpaid, Overdue) and instant action controls.
- Automatic company profile embedding (logos, digital signatures, bank coordinates, and GST information).

### 3. Business Identity and Banking Configuration
- Centralized company profile management for business legal names, addresses, tax registration numbers (GST), and contact information.
- Banking profile configuration: account holder names, account numbers, IFSC codes, and UPI IDs.
- Secure upload and management of company logo graphics and authorization signatures.

### 4. Customer Relationship Management (CRM)
- Customer directory with support for individual and business clients.
- Direct association with invoices and sales analytics.
- Contact information records including email, phone numbers, and physical billing addresses.

### 5. Product and Service Catalog
- Catalog items categorized by type (Physical Product, Digital Product, Service).
- Custom pricing models and inventory stock tracking.
- SKU indexing for rapid selection during invoice creation.

### 6. Task and Workload Management
- Structured task tracking with status indicators (To Do, In Progress, Completed), priority levels (Low, Medium, High), and deadlines.
- Dynamic filtering and instant completion toggles.
- Quota enforcement: maximum 10 tasks on Starter tier, unlimited on Premium tier.

### 7. Context-Aware AI Business Copilot
- Powered by Google Gemini 2.5 Flash via the `@google/generative-ai` SDK.
- Dynamic data injection: before generating responses, the API compiles active user financials, pending invoices, catalog items, and open tasks into the system instruction prompt.
- Answers financial queries, computes averages, analyzes unpaid invoices, and assists with business correspondence.

### 8. Automated Campaign and Transactional Emailing
- Native SMTP email dispatcher via Nodemailer.
- Direct transmission of customer invoices as PDF email attachments.
- Automated 6-digit OTP delivery for registration and password recovery.
- Daily quota limits: 10 emails per 24 hours for Starter users, unlimited for Premium subscribers.

### 9. Team Connect and Workspace Collaboration
- Premium collaboration suite enabling organization workspace messaging.
- Real-time team channels and direct member chat.
- User discovery and connection request workflow.

### 10. Multi-Device Session Security
- Concurrent device limiting: 1 active device session on the Starter plan, 2 devices on Premium.
- Device fingerprinting with `ua-parser-js` capturing browser, operating system, and IP address.
- Interactive modal alerting users upon exceeding limits, with immediate remote session revocation capabilities.

### 11. Authentication and Authorization
- Local authentication with email and password, protected by bcrypt (12 salt rounds).
- Two-step email verification with timed 6-digit one-time passcodes (OTP).
- Federated single sign-on (SSO) support via Google OAuth 2.0, GitHub OAuth, and Microsoft Azure.
- Token-based stateless authentication utilizing JSON Web Tokens (JWT) verified against active database sessions.

### 12. Monetization and Payment Gateway
- Complete checkout pipeline powered by Razorpay.
- Secure cryptographic signature validation (`crypto.createHmac('sha256')`) to prevent tampering.
- Automated subscription duration management with 30-day lifecycle handling.

---

## Technology Stack

### Frontend
| Component | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | 19.2.7 |
| Build Tool | Vite | 8.1.1 |
| Routing | React Router DOM | 7.18.1 |
| Styling | Tailwind CSS | 4.3.2 |
| Icons | Lucide React | 0.469.0 |
| PDF Export | html2pdf.js / html2canvas-pro | 0.14.0 / 2.2.3 |
| Code Linting | ESLint | 10.6.0 |

### Backend
| Component | Technology | Version |
| :--- | :--- | :--- |
| Runtime | Node.js | >= 18.x |
| Web Framework | Express | 4.19.2 |
| Database ODM | Mongoose | 8.4.1 |
| AI Integration | Google Generative AI SDK | 0.24.1 |
| Payment Gateway | Razorpay Node SDK | 2.9.4 |
| Authentication | JSON Web Token (jsonwebtoken) | 9.0.2 |
| Password Hashing | bcryptjs | 2.4.3 |
| Email Service | Nodemailer | 6.9.13 |
| Media Storage | Cloudinary Node SDK | 2.2.0 |
| Security Headers | Helmet | 7.1.0 |
| Rate Limiting | express-rate-limit | 7.3.1 |
| Device Parsing | ua-parser-js | 1.0.38 |
| Logging | Morgan | 1.10.0 |

---

## Project Directory Structure

```
Smart Pilot/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js         Cloudinary service initialization
│   │   └── db.js                 MongoDB Mongoose connection handler
│   ├── middleware/
│   │   └── auth.js               JWT and active session verification middleware
│   ├── models/
│   │   ├── ChannelMessage.js     Team channel message schema
│   │   ├── ChatRequest.js        User chat connection request schema
│   │   ├── Customer.js           CRM customer entity schema
│   │   ├── Invoice.js            Invoice structure and itemization schema
│   │   ├── OTP.js                Email one-time passcode verification schema
│   │   ├── PrivateMessage.js     Direct messaging entity schema
│   │   ├── Product.js            Catalog product and service schema
│   │   ├── SentEmail.js          Email dispatch log schema
│   │   ├── Session.js            Multi-device session tracking schema
│   │   ├── Task.js               User workload and to-do schema
│   │   ├── TeamChannel.js        Team collaboration channel schema
│   │   ├── TeamMember.js         Team membership mapping schema
│   │   └── User.js               User account, profile, and subscription schema
│   ├── routes/
│   │   ├── ai.js                 Google Gemini 2.5 Flash chat endpoint
│   │   ├── auth.js               Authentication, OAuth, OTP, password recovery
│   │   ├── customer.js           Customer CRUD operations
│   │   ├── email.js              Nodemailer dispatch and campaign logs
│   │   ├── invoice.js            Invoice generation and history management
│   │   ├── payment.js            Razorpay order creation and signature verification
│   │   ├── product.js            Product catalog CRUD operations
│   │   ├── task.js               Task workload CRUD operations
│   │   ├── team.js               Team channels and direct chat operations
│   │   ├── upload.js             Cloudinary asset upload endpoints
│   │   └── user.js               Profile updates, password change, session eviction
│   ├── utils/
│   │   ├── device.js             User-agent device parser
│   │   ├── email.js              HTML email templates and Nodemailer transport
│   │   └── token.js              JWT signing, verification, and SHA256 hashing
│   ├── .env.example              Backend environment template
│   ├── .gitignore                Backend file exclusion rules
│   ├── index.js                  Backend entrypoint and Express app definition
│   └── package.json              Backend dependencies and script definitions
├── frontend/
│   ├── public/                   Static assets, logos, and icons
│   ├── src/
│   │   ├── assets/               Bundled visual assets
│   │   ├── components/
│   │   │   ├── dashboard/        Sub-modules for dashboard tabs
│   │   │   ├── Dashboard.jsx     Main dashboard layout and navigation controller
│   │   │   ├── DeviceLimitDialog.jsx Session concurrency limit modal
│   │   │   ├── ForgotPassword.jsx    Password recovery interface
│   │   │   ├── Login.jsx             User login interface
│   │   │   ├── Navbar.jsx            Public landing page navigation
│   │   │   └── Signup.jsx            User registration and OTP interface
│   │   ├── pages/                Router view pages
│   │   ├── utils/
│   │   │   └── api.js            Unified client API request handler
│   │   ├── App.css               Global animation and layout overrides
│   │   ├── App.jsx               React client router
│   │   ├── index.css             Tailwind styling directives
│   │   └── main.jsx              Client entrypoint
│   ├── .env.example              Frontend environment template
│   ├── .gitignore                Frontend file exclusion rules
│   ├── package.json              Frontend dependencies and script definitions
│   ├── vercel.json               Vercel single-page application routing rules
│   └── vite.config.js            Vite bundler configuration
├── .editorconfig                 Cross-editor code formatting standards
├── .gitignore                    Root git exclusion rules
├── CODE_OF_CONDUCT.md            Contributor standards and pledge
├── CONTRIBUTING.md               Contribution guidelines and workflow
├── LICENSE                       MIT License documentation
├── README.md                     Repository documentation
└── SECURITY.md                   Vulnerability reporting and security policy
```

---

## API Reference

All protected endpoints require an `Authorization` header formatted as:
`Authorization: Bearer <jwt-token>`

### Health and Status
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Returns system status, environment, and timestamp. |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-register-otp` | No | Generates and sends a 6-digit registration OTP via email. |
| `POST` | `/api/auth/verify-register-otp` | No | Validates registration OTP and creates a new account. |
| `POST` | `/api/auth/login` | No | Authenticates credentials and returns a session JWT. |
| `POST` | `/api/auth/google-token` | No | Authenticates user with Google OAuth access token. |
| `POST` | `/api/auth/github-token` | No | Authenticates user with GitHub OAuth authorization code. |
| `POST` | `/api/auth/microsoft-token` | No | Authenticates user with Microsoft OAuth access token. |
| `POST` | `/api/auth/social-register` | No | Finalizes account creation for OAuth logins requiring details. |
| `POST` | `/api/auth/forgot-password` | No | Dispatches a password reset OTP to registered email. |
| `POST` | `/api/auth/reset-password` | No | Verifies reset OTP and updates user password. |
| `POST` | `/api/auth/logout` | Yes | Terminates current session and invalidates token. |
| `DELETE` | `/api/auth/delete-account` | Yes | Permanently removes user account and associated business data. |

### User Profile and Sessions (`/api/user`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/me` | Yes | Fetches user profile, company settings, and active sessions. |
| `PUT` | `/api/user/profile` | Yes | Updates profile details, company settings, and banking coordinates. |
| `POST` | `/api/user/change-password` | Yes | Modifies account password and revokes all other active sessions. |
| `POST` | `/api/user/sessions/evict` | Yes | Evicts a specific session device by session ID. |

### AI Services (`/api/ai`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Yes | Sends prompt to Gemini 2.5 Flash with live business context. |

### Invoices (`/api/invoices`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Yes | Retrieves all user invoices. |
| `POST` | `/api/invoices` | Yes | Creates a new invoice record. |
| `PUT` | `/api/invoices/:id` | Yes | Updates an existing invoice record. |
| `DELETE` | `/api/invoices/:id` | Yes | Deletes an invoice record. |

### Tasks (`/api/tasks`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Yes | Retrieves task workload list. |
| `POST` | `/api/tasks` | Yes | Creates a new task (subject to tier quota). |
| `PUT` | `/api/tasks/:id` | Yes | Updates status, priority, or completion state of a task. |
| `DELETE` | `/api/tasks/:id` | Yes | Deletes a task. |

### Customers (`/api/customers`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Yes | Retrieves list of saved customers. |
| `POST` | `/api/customers` | Yes | Creates a new customer profile. |
| `PUT` | `/api/customers/:id` | Yes | Updates customer details. |
| `DELETE` | `/api/customers/:id` | Yes | Removes a customer profile. |

### Product Catalog (`/api/products`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Yes | Retrieves product and service catalog items. |
| `POST` | `/api/products` | Yes | Adds a new product or service. |
| `PUT` | `/api/products/:id` | Yes | Updates product information and stock. |
| `DELETE` | `/api/products/:id` | Yes | Deletes a product item. |

### Email Campaigns (`/api/emails`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/emails` | Yes | Retrieves sent email logs. |
| `POST` | `/api/emails` | Yes | Sends custom email with optional PDF invoice attachment. |
| `DELETE` | `/api/emails/:id` | Yes | Deletes an email log record. |

### Payments (`/api/payment`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payment/plans` | No | Retrieves available subscription tiers and feature list. |
| `POST` | `/api/payment/create-order` | Yes | Initiates a Razorpay order for plan upgrade. |
| `POST` | `/api/payment/verify` | Yes | Verifies payment HMAC signature and elevates user plan. |

### Team Collaboration (`/api/team`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/team/channels` | Yes (Premium) | Lists accessible team channels. |
| `POST` | `/api/team/channels` | Yes (Premium) | Creates a team channel. |
| `GET` | `/api/team/channels/:channelId/messages` | Yes (Premium) | Fetches messages within a channel. |
| `POST` | `/api/team/channels/:channelId/messages` | Yes (Premium) | Posts a message to a channel. |
| `GET` | `/api/team/messages/:recipientId` | Yes (Premium) | Retrieves direct message history with a team member. |
| `POST` | `/api/team/messages/:recipientId` | Yes (Premium) | Sends a direct message to a user. |
| `GET` | `/api/team/requests` | Yes (Premium) | Retrieves incoming and outgoing chat requests. |
| `POST` | `/api/team/requests` | Yes (Premium) | Sends a chat connection request by email. |
| `POST` | `/api/team/requests/:id/respond` | Yes (Premium) | Accepts or declines a chat request. |

### File Uploads (`/api/upload`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload/avatar` | Yes | Uploads profile image to Cloudinary. |

---

## Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EXTRA_ALLOWED_ORIGINS=http://localhost:5174,https://your-production-domain.vercel.app

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smart-pilot?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_replace_this_with_a_64_char_random_string
JWT_EXPIRES_IN=15d

# Nodemailer / SMTP
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_azure_app_client_id
MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:5173/login

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini AI
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000

VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_MICROSOFT_CLIENT_ID=your_azure_app_client_id
```

---

## Installation and Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (local or MongoDB Atlas connection string)
- Google AI Studio API Key

### Step 1: Clone the Repository
```bash
git clone https://github.com/itzgauravgoswami/SmartPilotNew.git
cd SmartPilotNew
```

### Step 2: Configure Environment Files
```bash
# Set up backend configuration
cp backend/.env.example backend/.env

# Set up frontend configuration
cp frontend/.env.example frontend/.env
```
Fill in the respective credentials as outlined in the Environment Configuration section.

### Step 3: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 4: Run the Application in Development Mode

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
```
The backend server will start at `http://localhost:5000`.

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```
The frontend application will be accessible at `http://localhost:5173`.

---

## Subscription Tiers

Smart Pilot features a tiered access model enforced at the API level:

| Feature | Starter Plan (Free) | Premium Plan (₹21 / Month) |
| :--- | :--- | :--- |
| Price | ₹0 | ₹21 |
| Concurrent Devices | 1 active device | 2 active devices |
| Invoicing Suite | Unlimited | Unlimited |
| Task Manager | Maximum 10 tasks | Unlimited tasks |
| AI Campaign Emails | 10 emails per 24 hours | Unlimited emails |
| Team Connect Collaboration | Disabled | Full Access |
| AI Copilot Daily Prompts | 20 requests per day | 100 requests per day |
| Support | Standard Email Support | Priority Support |

---

## Security and Compliance

The platform applies multiple security measures to protect business and user data:

- **Strict Session Quotas**: Sessions are recorded in MongoDB with device metadata. Exceeding plan limits triggers enforcement logic where surplus devices must be explicitly revoked.
- **Password Protection**: User passwords are never saved in plain text. Passwords undergo bcrypt salting (factor 12) before storage and are omitted from user queries by default (`select: false`).
- **Signature Verification**: Razorpay webhooks and payment confirmations verify HMAC-SHA256 signatures before elevating user subscription privileges.
- **HTTP Protection**: Express routes are guarded by Helmet, CORS origin whitelisting, and Express Rate Limit (restricting brute force attacks on authentication routes to 20 attempts per 15 minutes in production).
- **Session Revocation on Password Reset**: When a user updates their password, all existing active sessions except the current request are invalidated immediately.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](file:///c:/Users/hp/Desktop/Placement/Placement_Projects/Smart%20Pilot/CONTRIBUTING.md) for details on code standards, branch conventions, and the pull request submission process.

---

## Security Policy

For vulnerability reports and disclosure procedures, refer to [SECURITY.md](file:///c:/Users/hp/Desktop/Placement/Placement_Projects/Smart%20Pilot/SECURITY.md).

---

## License

This project is licensed under the MIT License. See the [LICENSE](file:///c:/Users/hp/Desktop/Placement/Placement_Projects/Smart%20Pilot/LICENSE) file for details.

Developed and maintained by Gaurav Goswami.
