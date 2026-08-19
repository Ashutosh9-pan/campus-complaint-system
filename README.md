# CampusResolve

CampusResolve is a full-stack Campus Complaint Management System designed to help students raise, track, and manage complaints while providing administrators with tools to assign, update, monitor, and analyze complaint resolution.

## Features

### Student
- Secure registration and login
- Raise complaints with category, priority, location, and description
- Upload evidence images
- View complaint status and history
- Edit or delete complaints while allowed
- Track expected resolution dates
- Receive notifications
- Submit feedback and ratings after resolution
- Forgot password with OTP-based password reset

### Admin
- Dedicated admin dashboard
- View and filter all complaints
- Assign and reassign complaints
- Update complaint status
- Add administrator notes
- Track overdue complaints and escalation levels
- View complaint activity history
- Complaint analytics dashboard
- Feedback overview and insights
- Notification management

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Authentication & Security
- JWT Authentication
- bcrypt Password Hashing
- Express Validator
- Helmet
- API Rate Limiting
- CORS Configuration
- Secure File Upload Validation

### Email
- Resend API

## Project Structure

```text
campus-complaint-system/
├── config/
├── controllers/
├── middleware/
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/
├── routes/
├── utils/
├── server.js
├── package.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Ashutosh9-pan/campus-complaint-system.git
```

Move into the project directory:

```bash
cd campus-complaint-system
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root and configure the required environment variables:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=campus_complaint_system

JWT_SECRET=your_secure_jwt_secret

ADMIN_NAME=Campus Administrator
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

RESEND_API_KEY=your_resend_api_key
```

Start the application:

```bash
npm start
```

Open the application in your browser:

```text
http://localhost:5000
```

## Security

CampusResolve includes security measures such as:

- Password hashing using bcrypt
- JWT-based authentication and role authorization
- Request validation
- API rate limiting
- Security headers using Helmet
- Restricted file upload types and sizes
- Restricted evidence file serving
- Environment-based secret management
- Password reset OTP expiration and attempt limits

## Complaint Workflow

```text
Complaint Raised
      ↓
Assigned / Reviewed
      ↓
In Progress
      ↓
Resolved
      ↓
Student Feedback
```

## Use Case

CampusResolve can be used by colleges, universities, hostels, and other educational institutions to provide students with a structured complaint resolution system and help administrators manage issues more efficiently.

## Future Improvements

- Custom production email domain
- Cloud database deployment
- Production hosting
- Advanced reporting
- Mobile application
- Department-specific admin accounts
- Real-time notification support

## Author

**Ashutosh Panwar**

GitHub: https://github.com/Ashutosh9-pan
