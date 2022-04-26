# pypi source for rep_api library
```
https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-local/simple

```

cat /home/plinta/.pip/pip.conf 
[global]
trusted-host = artifactory-espoo1.ext.net.com
               pypi.org
index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-local/simple
extra-index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-remote/simple
                  https://pypi.org/simple/


# Postgre SQL installation
## Tutorial
https://www.digitalocean.com/community/tutorials/how-to-use-postgresql-with-your-django-application-on-ubuntu-20-04

## Issues with PostgreSQL
```
File "/home/plinta/repos/web_tools/.venv/lib/python3.8/site-packages/psycopg2/__init__.py", line 122, in connect
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

# Celery with Redis
## Tutorial
https://realpython.com/asynchronous-tasks-with-django-and-celery/#what-is-celery

# Usage
To start worker (needs to be daemonized in production)
```sh
celery -A backend worker -l info
```

To start task scheduler (needs to be daemonized in production)
```sh
celery -A backend beat -l info
```