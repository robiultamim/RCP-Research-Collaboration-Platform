@echo off
title RCP - Research Collaboration Platform Launcher
color 0A
cls
echo.
echo  ============================================================
echo    RESEARCH COLLABORATION PLATFORM (RCP)
echo    Auto Startup Script - Works on Any Windows PC
echo  ============================================================
echo.

set SCRIPT_DIR=%~dp0

:: ============================================================
:: STEP 1: Find Java (Any vendor / Any path)
:: ============================================================
echo  [1/4] Detecting Java runtime...

set JAVA_CMD=

:: 1. Try JAVA_HOME if set
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" set JAVA_CMD="%JAVA_HOME%\bin\java.exe"
)

:: 2. Try system PATH
if "%JAVA_CMD%"=="" (
    where java >nul 2>&1
    if %errorlevel%==0 set JAVA_CMD=java
)

:: 3. Try standard installation folders
if "%JAVA_CMD%"=="" (
    if exist "C:\Program Files\Eclipse Adoptium\*\bin\java.exe" (
        for /d %%i in ("C:\Program Files\Eclipse Adoptium\*") do set JAVA_CMD="%%i\bin\java.exe"
    )
)
if "%JAVA_CMD%"=="" (
    if exist "C:\Program Files\Java\jdk*\bin\java.exe" (
        for /d %%i in ("C:\Program Files\Java\jdk*") do set JAVA_CMD="%%i\bin\java.exe"
    )
)
if "%JAVA_CMD%"=="" (
    if exist "C:\Program Files\Java\jre*\bin\java.exe" (
        for /d %%i in ("C:\Program Files\Java\jre*") do set JAVA_CMD="%%i\bin\java.exe"
    )
)
if "%JAVA_CMD%"=="" (
    if exist "C:\Users\%USERNAME%\.jdks\*\bin\java.exe" (
        for /d %%i in ("C:\Users\%USERNAME%\.jdks\*") do set JAVA_CMD="%%i\bin\java.exe"
    )
)

if "%JAVA_CMD%"=="" (
    color 0C
    echo.
    echo  [ERROR] Java was not found on this computer!
    echo.
    echo  To run RCP, install Java 17 or higher:
    echo    1. Go to: https://adoptium.net
    echo    2. Download & install Eclipse Temurin (Java 17 LTS)
    echo    3. Then double-click this START-RCP.bat again.
    echo.
    pause
    exit /b 1
)
echo        Java detected: %JAVA_CMD%

:: ============================================================
:: STEP 2: Check XAMPP Apache & MySQL
:: ============================================================
echo  [2/4] Checking XAMPP Apache (port 80) ^& MySQL (port 3306)...

:: Apache
netstat -ano | findstr ":80 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo        Apache is already running on port 80.
) else (
    echo        Starting Apache...
    if exist "C:\xampp\apache_start.bat" (
        start /b "" "C:\xampp\apache_start.bat"
        timeout /t 3 /nobreak >nul
    ) else (
        echo  [NOTE] Please open XAMPP Control Panel and start Apache manually.
    )
)

:: MySQL
netstat -ano | findstr ":3306" | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo        MySQL is already running on port 3306.
) else (
    echo        Starting MySQL...
    if exist "C:\xampp\mysql_start.bat" (
        start /b "" "C:\xampp\mysql_start.bat"
        timeout /t 3 /nobreak >nul
    ) else (
        echo  [NOTE] Please open XAMPP Control Panel and start MySQL manually.
    )
)

:: ============================================================
:: STEP 3: Deploy/Sync Frontend to XAMPP htdocs
:: ============================================================
echo  [3/4] Syncing frontend to XAMPP htdocs...
if exist "C:\xampp\htdocs" (
    if exist "%SCRIPT_DIR%frontend" (
        xcopy /E /I /Y "%SCRIPT_DIR%frontend" "C:\xampp\htdocs\rcp\" >nul 2>&1
        echo        Frontend synced to C:\xampp\htdocs\rcp
    ) else (
        echo        Frontend folder not in script directory, keeping existing htdocs.
    )
) else (
    echo  [WARNING] C:\xampp\htdocs not found! Is XAMPP installed at C:\xampp?
)

:: ============================================================
:: STEP 4: Launch Spring Boot Backend
:: ============================================================
echo  [4/4] Starting Spring Boot Backend (port 8080)...

netstat -ano | findstr ":8080" | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo        Backend is already active on port 8080.
) else (
    set JAR_PATH="%SCRIPT_DIR%rcp-backend-1.0.0.jar"
    if not exist %JAR_PATH% (
        if exist "%SCRIPT_DIR%target\rcp-backend-1.0.0.jar" (
            set JAR_PATH="%SCRIPT_DIR%target\rcp-backend-1.0.0.jar"
        )
    )
    
    echo        Launching backend server...
    start "RCP Backend Server - DO NOT CLOSE" %JAVA_CMD% -jar %JAR_PATH%
    echo        Waiting for backend initialization (15 seconds)...
    timeout /t 15 /nobreak >nul
)

:: ============================================================
:: READY
:: ============================================================
color 0A
cls
echo.
echo  ============================================================
echo    ALL RCP SERVICES ARE RUNNING!
echo  ============================================================
echo.
echo    Open your browser and navigate to:
echo.
echo    ==^> http://localhost/rcp/login.html
echo.
echo  ============================================================
echo    Service Status:
echo    - Frontend     : http://localhost/rcp/login.html
echo    - REST API     : http://localhost:8080/api
echo    - Socket Chat  : localhost:9090 (Port 9090)
echo    - MySQL DB     : localhost:3306/rcp_db (Auto-configured)
echo  ============================================================
echo.
echo  Opening browser automatically...
start "" "http://localhost/rcp/login.html"
echo.
echo  (Note: Keep the "RCP Backend Server" window open while using the app)
echo.
pause
