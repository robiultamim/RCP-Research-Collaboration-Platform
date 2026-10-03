@echo off
title Research Collaboration Platform (RCP) - Smart Launcher
color 0A

echo ================================================================
echo       RESEARCH COLLABORATION PLATFORM (RCP) SYSTEM LAUNCHER
echo                     Smart Port Detection v2.0
echo ================================================================
echo.

:: 1. Check Java
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java is not found in PATH!
    echo Please install JDK 17 or higher.
    pause
    exit /b 1
)
echo [OK] Java detected.
echo.

:: 2. Detect MySQL Port (3306 or 3308)
set DB_PORT=3306
set DB_URL=jdbc:mysql://localhost:3306/rcp_db?createDatabaseIfNotExist=true^&useSSL=false^&allowPublicKeyRetrieval=true

netstat -ano | findstr ":3306" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL detected on port 3306.
    set DB_PORT=3306
    set DB_URL=jdbc:mysql://localhost:3306/rcp_db?createDatabaseIfNotExist=true^&useSSL=false^&allowPublicKeyRetrieval=true
    goto PORT_DETECTED
)

netstat -ano | findstr ":3308" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [NOTICE] MySQL not on 3306, but found on port 3308.
    echo          Using port 3308 for database connection.
    set DB_PORT=3308
    set DB_URL=jdbc:mysql://localhost:3308/rcp_db?createDatabaseIfNotExist=true^&useSSL=false^&allowPublicKeyRetrieval=true
    goto PORT_DETECTED
)

echo [WARNING] MySQL not detected on 3306 or 3308!
echo           Please start XAMPP MySQL service first, then re-run this file.
echo.
pause
exit /b 1

:PORT_DETECTED
echo [INFO] Database URL: %DB_URL%
echo.

:: 3. Check if XAMPP Apache is running (port 80)
netstat -ano | findstr ":80 " >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Apache not detected on port 80!
    echo           Please start XAMPP Apache service first.
    echo           The website will NOT load without Apache.
    echo.
    pause
)
echo [OK] Apache active on port 80.
echo.

:: 3.1 Auto-deploy/sync frontend to XAMPP htdocs
echo [INFO] Syncing frontend to C:\xampp\htdocs\rcp...
if exist "C:\xampp\htdocs" (
    if exist "%~dp0frontend" (
        xcopy /E /I /Y "%~dp0frontend" "C:\xampp\htdocs\rcp\" >nul 2>&1
        echo [OK] Frontend synced to C:\xampp\htdocs\rcp.
    ) else (
        echo [NOTICE] Frontend folder not found in launcher directory.
    )
) else (
    echo [WARNING] C:\xampp\htdocs not found! Ensure XAMPP is installed at C:\xampp.
)
echo.

:: 4. Launch Backend JAR with detected DB URL
echo [INFO] Starting Spring Boot Backend on port 8080...
if exist "%~dp0rcp-backend-1.0.0.jar" (
    start "RCP Backend" java -jar "%~dp0rcp-backend-1.0.0.jar" --spring.datasource.url="%DB_URL%"
) else if exist "%~dp0target\rcp-backend-1.0.0.jar" (
    start "RCP Backend" java -jar "%~dp0target\rcp-backend-1.0.0.jar" --spring.datasource.url="%DB_URL%"
) else (
    echo [ERROR] rcp-backend-1.0.0.jar not found!
    echo         Make sure you are running this from the RCP-DEPLOY folder.
    pause
    exit /b 1
)

echo.
echo [INFO] Waiting 10 seconds for Spring Boot to initialize...
timeout /t 10 /nobreak >nul

:: 5. Open Application
echo [INFO] Opening RCP Web Application in browser...
start http://localhost/rcp/index.html

echo.
echo ================================================================
echo   RCP SYSTEM IS NOW RUNNING!
echo.
echo   Website  : http://localhost/rcp/
echo   Backend  : http://localhost:8080/api/
echo   Database : MySQL on port %DB_PORT%
echo.
echo   Demo Login Accounts:
echo   Student/Researcher : tamim@gmail.com       / 123456
echo   Supervisor Faculty : karim.sup2@test.com   / sup123
echo   Co-Researcher      : rafi@cse.buet.ac.bd   / password123
echo   Admin              : (admin login via admin panel)
echo.
echo   [Keep this window open while presenting!]
echo   [Close this window to shut down the backend.]
echo ================================================================
echo.
pause
