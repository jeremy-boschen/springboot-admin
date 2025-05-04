@echo off
echo Obserra Debugging Script
echo.
echo This script helps you run the Obserra components for debugging.
echo.

:menu
echo Choose a debugging approach:
echo 1. Docker-based Development (all components in Docker)
echo 2. Hybrid Development (dashboard in Docker, Spring Boot locally)
echo 3. Fully Local Development (all components locally)
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto docker
if "%choice%"=="2" goto hybrid
if "%choice%"=="3" goto local
if "%choice%"=="4" goto end
echo Invalid choice. Please try again.
goto menu

:docker
echo.
echo Starting Docker-based development environment...
docker-compose -f debug-docker-compose.yml up --build
goto end

:hybrid
echo.
echo Starting Hybrid development environment...
echo.
echo Step 1: Building and running the dashboard in Docker...
cd obserra-dashboard
docker build -t obserra-dashboard .
start docker run -p 3000:3000 -e NODE_ENV=development obserra-dashboard
cd ..
echo.
echo Step 2: Building the Spring Boot starter...
call gradlew :obserra-spring-boot-starter:build
echo.
echo Step 3: Running the sample app with debugging enabled...
echo The app will be available at http://localhost:8080
echo The debugger will be available on port 5005
echo.
call gradlew :obserra-samples:demo-app-gradle:bootRun --debug-jvm
goto end

:local
echo.
echo Starting Fully Local development environment...
echo.
echo Step 1: Starting the dashboard locally...
start cmd /k "cd obserra-dashboard && npm install && npm run dev"
echo.
echo Step 2: Building the Spring Boot starter...
call gradlew :obserra-spring-boot-starter:build
echo.
echo Step 3: Running the sample app with debugging enabled...
echo The app will be available at http://localhost:8080
echo The debugger will be available on port 5005
echo.
call gradlew :obserra-samples:demo-app-gradle:bootRun --debug-jvm
goto end

:end
echo.
echo Script completed.