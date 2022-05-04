#!/bin/bash

# until cd /app/backend/server
# do
#     echo "Waiting for server volume..."
# done

until ./manage.py migrate
do
    echo "Waiting for db to be ready..."
    sleep 2
done

python manage.py collectstatic --noinput

gunicorn backend.wsgi --bind 0.0.0.0:8000 --workers 4 --threads 4
# command: gunicorn backend.wsgi:application --bind 0.0.0.0:8000