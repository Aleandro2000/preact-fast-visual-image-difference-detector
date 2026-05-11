#!/bin/bash
set -e

echo "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

echo "Deployment completed!"