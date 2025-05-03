#!/bin/bash
set -e

# Build and start the application with Docker Compose
build_and_start() {
  echo "Building and starting the application..."
  docker-compose up --build -d
  echo "Application is running at http://localhost:3000"
}

# Stop the running container
stop() {
  echo "Stopping the application..."
  docker-compose down
  echo "Application stopped."
}

# Build the Docker image only
build_image() {
  echo "Building the Docker image..."
  docker build -t k8s-springboot-dashboard:latest .
  echo "Docker image built."
}

# Show help message
show_help() {
  echo "K8s Spring Boot Dashboard Build Script"
  echo ""
  echo "Usage: ./build.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       Build and start the application with Docker Compose"
  echo "  stop        Stop the running application"
  echo "  build       Only build the Docker image"
  echo "  help        Show this help message"
  echo ""
  echo "If no command is provided, the script will default to 'start'"
}

# Main script logic
case "$1" in
  start)
    build_and_start
    ;;
  stop)
    stop
    ;;
  build)
    build_image
    ;;
  help)
    show_help
    ;;
  *)
    if [ -z "$1" ]; then
      build_and_start
    else
      echo "Unknown command: $1"
      show_help
      exit 1
    fi
    ;;
esac