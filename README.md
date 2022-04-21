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
https://www.digitalocean.com/community/tutorials/how-to-use-postgresql-with-your-django-application-on-ubuntu-20-04