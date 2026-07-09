#!/bin/sh
set -e

# Convert Railway's DATABASE_URL (postgresql://...) to JDBC format if DB_URL is unset
if [ -z "$DB_URL" ] && [ -n "$DATABASE_URL" ]; then
  DB_URL="jdbc:${DATABASE_URL}"
  export DB_URL
fi

# Wait for S3-compatible storage to be ready, then create bucket
if [ -n "$R2_ENDPOINT" ]; then
  echo "Waiting for S3-compatible storage at $R2_ENDPOINT..."
  until mc alias set storage "$R2_ENDPOINT" "$R2_ACCESS_KEY" "$R2_SECRET_KEY" 2>/dev/null; do
    sleep 2
  done
  mc mb "storage/${R2_BUCKET:-gnosis}" --ignore-existing
  echo "Bucket ready"
fi

exec java -jar app.jar
