#!/bin/sh
# Runs the database migrations (packages/server/migrations/*.sql) on the local Docker database.
# Used by the "migrate" service in compose.yaml, which runs it inside a postgres container (it needs psql).
#
#   docker compose run --rm instrument-migrate             runs every migration that has not run yet, in number order
#   docker compose run --rm instrument-migrate 003         runs only migration 003 (by number or by file name)
#
# Every migration that ran is written in the schema_migrations table, so a migration never runs twice
# (they use CREATE TABLE, which fails the second time). Each one runs in a transaction together with
# that record: if a migration fails, nothing of it is kept and it is not marked as done.
# Only for the local database: the Supabase databases are still migrated by hand (docs/adr/001-database-choice.md).
set -eu

MIGRATIONS_DIR=/migrations
# Stop at the first SQL error, quiet output.
PSQL="psql -v ON_ERROR_STOP=1 -q"

$PSQL -c "CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)"

# The file name goes into SQL text (already_applied, run_migration), so only accept the "<number>_<words>.sql" format.
# Call this before using a name in SQL.
check_name() {
  if ! echo "$1" | grep -Eq '^[0-9]+_[A-Za-z0-9_]+\.sql$'; then
    echo "Stopping at $1: migration files must be named like 003_create_something.sql" >&2
    exit 1
  fi
}

# Prints "yes" if the migration already ran. The name must have passed check_name.
already_applied() {
  $PSQL -tA -c "SELECT 'yes' FROM schema_migrations WHERE name = '$1'"
}

# Runs one migration file. Its name must have passed check_name.
run_migration() {
  file="$1"
  name=$(basename "$file")
  echo "Running $name"
  # -1 wraps the file and the record in one transaction: both are saved, or neither.
  $PSQL -1 -f "$file" -c "INSERT INTO schema_migrations (name) VALUES ('$name')"
}

if [ $# -eq 0 ]; then
  # No argument: run every migration that has not run yet. The shell sorts the files by name, so 001 comes before 002.
  ran=0
  for file in "$MIGRATIONS_DIR"/*.sql; do
    [ -e "$file" ] || continue
    name=$(basename "$file")
    check_name "$name"
    if [ -n "$(already_applied "$name")" ]; then
      echo "Skipping $name: already ran"
      continue
    fi
    run_migration "$file"
    ran=$((ran + 1))
  done
  echo "Migrations done ($ran new)."
else
  # One argument: run that migration only, given as a file name (003_x.sql) or just its number (003).
  case "$1" in
    *.sql) file="$MIGRATIONS_DIR/$(basename "$1")" ;;
    *) file=$(ls "$MIGRATIONS_DIR"/"$1"_*.sql 2>/dev/null | head -n 1) ;;
  esac
  if [ -z "$file" ] || [ ! -e "$file" ]; then
    echo "No migration found for \"$1\". Available:" >&2
    ls "$MIGRATIONS_DIR" >&2
    exit 1
  fi
  name=$(basename "$file")
  check_name "$name"
  # Already ran: not an error, there is just nothing to do.
  if [ -n "$(already_applied "$name")" ]; then
    echo "Skipping $name: already ran"
  else
    run_migration "$file"
    echo "Migration done."
  fi
fi
