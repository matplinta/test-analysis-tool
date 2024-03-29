# Test Analysis Tool
Web app facilitating reporting and semi-automatic analysis of test results for an internal reporting platform. 
Written in Django (DRF) and ReactJS.
__________

## Development using Docker 
### Windows prerequisites
For Docker development to work with windows, you need to install:
- WSL 2 (enable hardware virtualization)
- Docker Desktop

### Use `docker-compose`

Simply build the environment
```bash
docker-compose build
```
and start it
```bash
docker-compose up
```

### Postgres DB
#### Copy database contents from *.sql file
1. Clear contents of docker mounted volume e.g. `./postgres_db`
2. Start _db_ container
3. Copy *.sql file to the container using
    ```
    docker cp postgres-backup_1700571601.sql e3053a1400be:/
    ```
4. Populate the database with data using the following command on the db container:
    ```
    docker exec -it e3053a1400be bash   # get into the container
    psql -U postgres -d postgres -f postgres-backup_1700571601.sql
    ```

### Endpoints
localhost and 127.0.0.1 should be interchangeable.
- localhost:3000 - frontend via react
- localhost:5557 - celery flower task dashboard
- localhost:8000 - backend via django
    - /api/tra - api endpoint for Test Results Analyzer
    - /admin - api endpoint for django admin panel


## Local Development
### Backend

#### Add pypi source for rep_api library
Add the following contents to your local pip configuration file.
Common location is `/home/<user>/.pip/pip.conf`
```
[global]
trusted-host = artifactory-espoo1.ext.net.com
               pypi.org
index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-local/simple
extra-index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-remote/simple
                  https://pypi.org/simple/
```
This will allow you to install rep_api library via pip.
#### Install python libraries
It is advisable to create python virtual environment for local development. Then in it, run:
`backend/$ pip install requirements/dev.txt`
#### Run django backend
`backend/$ python manage.py runserver`

#### Run jupyter notebook for django development
`backend/$ python manage.py shell_plus --notebook`
For jupyter setup to work asynchronically, firstly run
```python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rest.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()
```


### Database
#### Postgre SQL installation
Tutorial: https://www.digitalocean.com/community/tutorials/how-to-use-postgresql-with-your-django-application-on-ubuntu-20-04

#### Issues with PostgreSQL
```
File "/home/user/repos/web_tools/.venv/lib/python3.8/site-packages/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
django.db.utils.OperationalError: could not connect to server: Connection refused
        Is the server running on host "localhost" (127.0.0.1) and accepting
        TCP/IP connections on port 5432?
```
Remedy:
```sh
(.venv) ➜  web_tools git:(master) ✗ sudo service postgresql status
12/main (port 5432): down
(.venv) ➜  web_tools git:(master) ✗ sudo service postgresql start
 * Starting PostgreSQL 12 database server                                                                                                                                                          [ OK ]
(.venv) ➜  web_tools git:(master) ✗
```
#### Database backup script
Done via crone tab:
```
@hourly /home/ute/web-tools/backup_postgres_db.sh >> /home/ute/backup_db_cron_log.txt 2>&1
```

### Celery with Redis
Tutorial: https://realpython.com/asynchronous-tasks-with-django-and-celery/#what-is-celery

#### Usage
To start worker
```sh
celery -A backend worker -l info
```

To start task scheduler
```sh
celery -A backend beat -l info
```

### Frontend
#### Install libraries
```bash
frontend/$ npm install
```
#### Run frontend
```bash
frontend/$ npm start
```
