# 🔬 Research Collaboration Platform (RCP)

A full-stack web application for managing academic research projects, tasks, team collaboration, and real-time communication between researchers, supervisors, and administrators.

## ✨ Features

- **Role-Based Access Control** — Student/Researcher, Supervisor, Admin roles with separate dashboards
- **Research Project Management** — Create projects, manage members, track progress
- **Kanban Task Board** — Drag-and-drop task management with permission enforcement
  - Only Supervisors/Admins can approve tasks to `COMPLETED`
  - Non-assignees can view but not drag
- **Real-Time Chat** — 1-on-1 direct messaging + Project group channels (2.5s polling)
- **File Management** — Upload/download project files with member-only access control
- **Notification System** — Task assignments, project invites, status updates
- **Admin Panel** — Full user and project management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Java 17, Spring Boot, Spring Data JPA, Spring Security |
| Database | MySQL / MariaDB |
| Web Server | Apache (XAMPP) |
| Build Tool | Maven |

## 🚀 Running Locally

### Prerequisites
- Java JDK 17+
- XAMPP (Apache + MySQL)
- Maven

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rcp.git
   cd rcp
   ```

2. **Setup Database**
   - Start XAMPP → Start Apache + MySQL
   - Open `http://localhost/phpmyadmin`
   - Create database: `rcp_db`
   - The backend auto-creates all tables on first run (Spring Boot JPA)

3. **Configure Database (if needed)**
   
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/rcp_db?createDatabaseIfNotExist=true&useSSL=false
   spring.datasource.username=root
   spring.datasource.password=
   ```

4. **Build and Run Backend**
   ```bash
   mvn clean package -DskipTests
   java -jar target/rcp-backend-1.0.0.jar
   ```
   Backend runs on: `http://localhost:8080`

5. **Setup Frontend**
   - Copy the `frontend/` folder to: `C:\xampp\htdocs\rcp\`
   - Open: `http://localhost/rcp/index.html`

### Port Conflict (MySQL on 3308)
If another MySQL instance is running on 3306, XAMPP MySQL uses 3308. Override:
```bash
java -jar target/rcp-backend-1.0.0.jar --spring.datasource.url="jdbc:mysql://localhost:3308/rcp_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
```

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student/Researcher | tamim@gmail.com | 123456 |
| Supervisor | karim.sup2@test.com | sup123 |
| Co-Researcher | rafi@cse.buet.ac.bd | password123 |

## 📁 Project Structure

```
rcp/
├── src/
│   └── main/
│       ├── java/com/rcp/
│       │   ├── controller/     # REST API Controllers
│       │   ├── model/          # JPA Entity classes
│       │   ├── repository/     # Spring Data JPA Repositories
│       │   ├── service/        # Business Logic Services
│       │   └── config/         # Security & CORS Config
│       └── resources/
│           └── application.properties
├── frontend/
│   ├── css/style.css           # Global styles
│   ├── js/
│   │   ├── auth.js             # Core auth + all page logic
│   │   ├── tasks.js            # Kanban drag-drop logic
│   │   ├── chat.js             # Real-time chat polling
│   │   └── api.js              # API helpers
│   ├── student/                # Student role pages
│   ├── supervisor/             # Supervisor role pages
│   ├── admin/                  # Admin role pages
│   └── index.html              # Landing / Login page
└── pom.xml
```

## 🔌 API Endpoints (Key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/projects` | List all projects |
| GET | `/api/tasks/my/{userId}` | Get user's tasks |
| PUT | `/api/tasks/{id}/status` | Update task status |
| POST | `/api/chat/send` | Send chat message |
| GET | `/api/chat/direct` | Get direct messages |
| POST | `/api/files/upload` | Upload project file |

## 📄 License

This project was developed as an academic project for university coursework.
