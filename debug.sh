#!/bin/bash
# Obserra Debugging Script for Linux/macOS

echo "Obserra Debugging Script"
echo
echo "This script helps you run the Obserra components for debugging."
echo

show_menu() {
  echo "Choose a debugging approach:"
  echo "1. Docker-based Development (all components in Docker)"
  echo "2. Hybrid Development (dashboard in Docker, Spring Boot locally)"
  echo "3. Fully Local Development (all components locally)"
  echo "4. Exit"
  echo
  read -p "Enter your choice (1-4): " choice
}

docker_approach() {
  echo
  echo "Starting Docker-based development environment..."
  docker-compose -f debug-docker-compose.yml up --build
}

hybrid_approach() {
  echo
  echo "Starting Hybrid development environment..."
  echo
  echo "Step 1: Building and running the dashboard in Docker..."
  cd obserra-dashboard
  docker build -t obserra-dashboard .
  docker run -d -p 3000:3000 -e NODE_ENV=development obserra-dashboard
  cd ..
  echo
  echo "Step 2: Building the Spring Boot starter..."
  ./gradlew :obserra-spring-boot-starter:build
  echo
  echo "Step 3: Running the sample app with debugging enabled..."
  echo "The app will be available at http://localhost:8080"
  echo "The debugger will be available on port 5005"
  echo
  ./gradlew :obserra-samples:demo-app-gradle:bootRun --debug-jvm
}

local_approach() {
  echo
  echo "Starting Fully Local development environment..."
  echo
  echo "Step 1: Starting the dashboard locally..."
  npm --prefix obserra-dashboard install
  npm --prefix obserra-dashboard run dev &
  echo
  echo "Step 2: Building the Spring Boot starter..."
  ./gradlew :obserra-spring-boot-starter:build
  echo
  echo "Step 3: Running the sample app with debugging enabled..."
  echo "The app will be available at http://localhost:8080"
  echo "The debugger will be available on port 5005"
  echo
  ./gradlew :obserra-spring-boot-samples:demo-app-gradle:bootRun --debug-jvm
}

# Main script logic
while true; do
  show_menu
  
  case $choice in
    1)
      docker_approach
      break
      ;;
    2)
      hybrid_approach
      break
      ;;
    3)
      local_approach
      break
      ;;
    4)
      echo "Exiting..."
      break
      ;;
    *)
      echo "Invalid choice. Please try again."
      ;;
  esac
done

echo
echo "Script completed."