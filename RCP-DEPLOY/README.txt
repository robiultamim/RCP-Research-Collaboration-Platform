# RCP - Research Collaboration Platform
## How to Run on ANY PC

### Requirements (install once on new PC):
1. XAMPP  ->  https://www.apachefriends.org  (includes Apache + MySQL)
2. Java 17 ->  https://adoptium.net           (choose Java 17 LTS)

### To Run the Project:
1. Install XAMPP and Java (one-time setup on new PC)
2. Open XAMPP Control Panel - Start Apache + MySQL
3. Double-click START-RCP.bat
4. Browser opens automatically at: http://localhost/rcp/login.html

### This folder contains:
- START-RCP.bat          <- Double-click to launch everything
- rcp-backend-1.0.0.jar  <- Spring Boot backend (Java)
- frontend/              <- All 36 HTML pages

### Login Credentials (demo):
- Admin:      admin@rcp.com     / admin123
- Supervisor: supervisor@rcp.com / super123  
- Student:    student@rcp.com   / student123
(Register via the register page to create real accounts)

### Ports Used:
- Port 80   -> Frontend (Apache/XAMPP)
- Port 8080 -> Backend REST API (Spring Boot)
- Port 9090 -> Real-time Chat (Java Socket)
- Port 3306 -> MySQL Database
