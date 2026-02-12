# Hostel Management System - Backend API

Complete backend API for a comprehensive hostel management system with admin panel, student applications, and inventory management.

## Features

### Admin Panel
- ✅ Admin Registration & Login (separate from students)
- ✅ View only assigned hostels
- ✅ Manage hostel applications
  - View pending, approved, rejected applications
  - Accept applications with room assignment
  - Reject applications with reason
- ✅ Hostel Inventory Management
  - View room availability statistics
  - Filter rooms by floor, status (empty/filled/damaged/maintenance)
  - Visual seat map layout by floor
  - Track assigned students per room
  - Update room status
- ✅ Advanced Filters
  - Filter by floor number
  - Filter by room status
  - Filter by occupancy (filled/empty rooms)

### Student Portal
- ✅ Student Registration & Login
- ✅ Apply for hostel accommodation
- ✅ Track application status

### General
- ✅ JWT-based authentication (can be enabled)
- ✅ Role-based access (admin/student)
- ✅ Comprehensive error handling
- ✅ Database seeding with sample data

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcryptjs
- **File Uploads:** Multer
- **Environment:** dotenv

## Project Structure

```
hostel-mgmt-backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection config
│   ├── controllers/
│   │   ├── adminController.js    # Admin operations (NEW)
│   │   ├── authController.js     # Student auth
│   │   ├── applicationController.js
│   │   └── hostelController.js
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── upload.js            # File upload handling
│   ├── models/
│   │   ├── Admin.js             # Admin model (NEW)
│   │   ├── Student.js           # Student model
│   │   ├── Hostel.js            # Hostel model
│   │   ├── Application.js       # Application model
│   │   └── Room.js              # Room model (NEW)
│   ├── routes/
│   │   ├── adminRoutes.js       # Admin routes (NEW)
│   │   ├── authRoutes.js
│   │   ├── applicationRoutes.js
│   │   └── hostelRoutes.js
│   └── index.js                 # Express app setup
├── uploads/                     # File upload directory
├── seed.js                      # Database seeding script (NEW)
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── ADMIN_API_DOCS.md           # Admin API documentation (NEW)
├── API_TEST_GUIDE.sh           # Testing guide with curl examples (NEW)
└── README.md
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hostel-mgmt
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5174
```

### 3. Database Setup

**Option A: Using MongoDB Locally**
```bash
# Start MongoDB
mongod
```

**Option B: Using MongoDB Atlas (Cloud)**
- Update `MONGODB_URI` in `.env` with your MongoDB Atlas connection string

### 4. Seed Database
```bash
npm run seed
```

This creates:
- 3 Admin accounts
- 10 Hostels (5 each for 2 admins, 2 for 1 admin)
- 305 Rooms (61 per hostel with different statuses)
- 20 Students
- 20 Sample Applications

### 5. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:8000`

---

## Default Admin Credentials

After seeding, use these credentials to login:

```
Admin ID: ADMIN001 | Password: Admin@12345 | Email: priya.admin@hostel.com
Admin ID: ADMIN002 | Password: Admin@12345 | Email: rajesh.admin@hostel.com
Admin ID: ADMIN003 | Password: Admin@12345 | Email: meera.admin@hostel.com
```

---

## API Overview

### Admin Routes (`/api/admin`)

#### Authentication
- `POST /register` - Register new admin
- `POST /login` - Admin login

#### Hostel Management
- `GET /:adminId/hostels` - Get admin's hostels

#### Application Management
- `GET /hostels/:hostelId/applications` - Get hostel applications
- `PUT /applications/:applicationId/accept` - Accept application & assign room
- `PUT /applications/:applicationId/reject` - Reject application with reason

#### Inventory Management
- `GET /hostels/:hostelId/inventory` - Get inventory stats & seat map
- `GET /hostels/:hostelId/rooms` - Get rooms with filters
- `PUT /rooms/:roomId/update-status` - Update room status

### Student Routes (`/api/auth`)
- `POST /register` - Student registration
- `POST /login` - Student login
- `GET /me` - Get current student profile

### Application Routes (`/api/applications`)
- Student application endpoints

### Hostel Routes (`/api/hostels`)
- Get hostel listings

---

## Usage Examples

### 1. Admin Login
```bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"adminId":"ADMIN001","password":"Admin@12345"}'
```

### 2. Get Admin Hostels
```bash
curl -X GET http://localhost:8000/api/admin/ADMIN001/hostels
```

### 3. Get Hostel Applications
```bash
curl -X GET "http://localhost:8000/api/admin/hostels/{hostelId}/applications?status=Pending"
```

### 4. Accept Application
```bash
curl -X PUT http://localhost:8000/api/admin/applications/{applicationId}/accept \
  -H "Content-Type: application/json" \
  -d '{"roomNumber":"101","floor":"Floor 1"}'
```

### 5. Get Hostel Inventory
```bash
curl -X GET "http://localhost:8000/api/admin/hostels/{hostelId}/inventory"
```

### 6. Filter Rooms
```bash
# Get empty rooms on Floor 1
curl -X GET "http://localhost:8000/api/admin/hostels/{hostelId}/rooms?floor=Floor 1&status=empty"

# Get damaged rooms
curl -X GET "http://localhost:8000/api/admin/hostels/{hostelId}/rooms?status=damaged"
```

---

## Database Models

### Admin
```javascript
{
  name: String,
  email: String (unique),
  adminId: String (unique),
  password: String (hashed),
  phone: String,
  hostelIds: [ObjectId],
  isActive: Boolean
}
```

### Hostel
```javascript
{
  name: String (unique),
  description: String,
  location: String,
  warden: String,
  capacity: Number,
  amenities: [String],
  gender: Enum ['Male', 'Female', 'Co-ed'],
  rentPerMonth: Number,
  adminId: ObjectId (ref: Admin),
  image: String
}
```

### Room
```javascript
{
  roomNumber: String,
  floor: String,
  hostelId: ObjectId (ref: Hostel),
  capacity: Number,
  occupiedSpaces: Number,
  status: Enum ['empty', 'filled', 'damaged', 'maintenance'],
  assignedStudents: [ObjectId] (ref: Student),
  lastInspection: Date
}
```

### Student
```javascript
{
  name: String,
  email: String (unique),
  pnr: String (unique),
  password: String (hashed),
  gender: String,
  year: String,
  phone: String,
  address: String,
  role: Enum ['student', 'admin']
}
```

### Application
```javascript
{
  studentId: ObjectId (ref: Student),
  hostelId: ObjectId (ref: Hostel),
  studentName: String,
  status: Enum ['Pending', 'Approved', 'Rejected', 'Cancelled'],
  approvedOn: Date,
  rejectionReason: String,
  roomNumber: String,
  floor: String,
  appliedOn: Date
}
```

---

## Features Implemented

### ✅ Core Functionality
- [x] Admin authentication (registration & login)
- [x] View assigned hostels only
- [x] View hostel applications
- [x] Accept/Reject applications with room assignment
- [x] Hostel inventory management with statistics
- [x] Room status tracking (empty/filled/damaged/maintenance)
- [x] Advanced filtering by floor and status
- [x] Seat map visualization (grouped by floor)
- [x] Database seeding with realistic data

### ✅ Data Model
- [x] Admin model with hostel relationships
- [x] Room model with occupancy tracking
- [x] Updated Hostel model with admin ID
- [x] Application model with room assignment

### ✅ Additional Features
- [x] Room capacity tracking
- [x] Student assignment to rooms
- [x] Room status updates with notes
- [x] Last inspection timestamp
- [x] Comprehensive error handling
- [x] RESTful API design

---

## Future Enhancements

- [ ] JWT token validation and authorization
- [ ] Role-based access control (RBAC)
- [ ] Image upload for hostels
- [ ] Email notifications for application status
- [ ] Admin dashboard with charts
- [ ] Payment integration
- [ ] Room maintenance tracking
- [ ] Feedback and rating system
- [ ] Report generation
- [ ] API rate limiting
- [ ] Caching for better performance

---

## Testing

See [API_TEST_GUIDE.sh](API_TEST_GUIDE.sh) for comprehensive testing commands with curl examples.

Or read [ADMIN_API_DOCS.md](ADMIN_API_DOCS.md) for detailed API documentation.

---

## Scripts

```bash
# Start development server
npm run dev

# Seed database with sample data
npm run seed

# Run tests (not configured yet)
npm test
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

- Authentication tokens are currently not enforced (will be implemented later)
- Passwords are hashed using bcryptjs before storage
- All sensitive data is excluded from JSON responses
- CORS is enabled for `http://localhost:5174`
- File uploads are limited to 10MB
- MongoDB indexes are set up for faster queries

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push to remote

---

## License

ISC

---

## Support

For issues or questions, please create an issue in the repository.
