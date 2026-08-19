#!/bin/sh
set -e

echo "Running migrations..."
npx sequelize-cli db:migrate

echo "Starting server..."
exec node dist/src/app.js
