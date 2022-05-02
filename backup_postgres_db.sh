#!/bin/bash
set -o pipefail
timestamp=$(date +%s)
db_backup_dir=/usr/local/share/postgres_db_backups

mkdir -p "$db_backup_dir"

cd "$db_backup_dir"

docker exec -i postgres_db /usr/bin/pg_dump -U postgres postgres | gzip -9 > $db_backup_dir/postgres-backup_$timestamp.sql.gz
status=$?

file_no=$(find . -printf "%T@ %Tc %p\n" | grep './postgres' | sort -n | cut -f'9' -d' ' | wc -l)

if [ "$file_no" -gt 3 ]; then
  echo "More than 3 db.backups files. Will perform rolling update"
  file_to_rm=$(find . -printf "%T@ %Tc %p\n" | grep './postgres' | sort -n | cut -f'9' -d' ' | head -n 1)
  if [ "$status" -eq 0 ]; then
    echo "Removing file $file_to_rm"
    rm -f "$file_to_rm"
  fi
fi


