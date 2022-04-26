FROM python:3.8-buster 

ENV HTTP_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV http_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV FTP_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV no_proxy=localhost,127.0.0.0/8,::1,localhost,127.0.0.0/8,192.168.0.0/16,192.168.255.1,192.168.255.129,192.168.255.20,192.168.255.21,192.168.255.22,192.168.200.1,192.168.200.129,192.168.200.2,192.168.200.130,pypi.ute.inside.nsn.com,files.ute.inside.nsn.com,repo.wroclaw.nsn-rdnet.net,rep-portal.wroclaw.nsn-rdnet.net,10.44.160.66,10.42.161.4,4g-rep-portal.wroclaw.nsn-rdnet.net,5g-rep-portal.wroclaw.nsn-rdnet.net,wrling37.emea.nsn-net.net,wrling23.emea.nsn-net.net
ENV HTTPS_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV https_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV ftp_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV CELERY_BROKER=redis://redis:6379/0
ENV CELERY_BACKEND=redis://redis:6379/0

WORKDIR /code

RUN apt-get update  --yes
RUN apt-get install libsasl2-dev python-dev libldap2-dev libssl-dev  --yes
RUN mkdir -p /root/.pip
RUN echo "[global]\n" \
"trusted-host = artifactory-espoo1.ext.net.com\n" \
"               pypi.org\n" \
"index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-local/simple\n" \
"extra-index-url = https://artifactory-espoo1.ext.net.com/artifactory/api/pypi/rep-pypi-remote/simple\n" \
"                  https://pypi.org/simple/\n" > /root/.pip/pip.conf 

COPY . /code/
COPY ./requirements.txt /code/

RUN pip install -r requirements.txt

COPY ./celery_flower_start.sh /start-flower
RUN chmod +x /start-flower

