#!/bin/bash
set -e

# Create a new user if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO
    \$do\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'turtrack_user') THEN
            CREATE USER turtrack_user WITH PASSWORD 'turtrack_password';
        END IF;
    END
    \$do\$;
EOSQL

# Create a new database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE turtrack_manager_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'turtrack_manager_db')\gexec
    ALTER DATABASE turtrack_manager_db OWNER TO turtrack_user;
EOSQL

# Grant all privileges on the database to the user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE turtrack_manager_db TO turtrack_user;
EOSQL