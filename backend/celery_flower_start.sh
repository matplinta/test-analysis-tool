#!/bin/bash

set -o errexit
set -o nounset

worker_ready() {
    celery -A backend inspect ping
}

until worker_ready; do
  >&2 echo 'Celery workers not available'
  sleep 1
done
>&2 echo 'Celery workers is available'

celery -A backend  \
    --broker="${CELERY_BROKER}" \
    flower