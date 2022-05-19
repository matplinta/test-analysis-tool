FROM node:16.14.2

ENV HTTP_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV http_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV FTP_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV no_proxy=localhost,127.0.0.0/8,::1,localhost,127.0.0.0/8,192.168.0.0/16,192.168.255.1,192.168.255.129,192.168.255.20,192.168.255.21,192.168.255.22,192.168.200.1,192.168.200.129,192.168.200.2,192.168.200.130,pypi.ute.inside.nsn.com,files.ute.inside.nsn.com,repo.wroclaw.nsn-rdnet.net,rep-portal.wroclaw.nsn-rdnet.net,10.44.160.66,10.42.161.4,4g-rep-portal.wroclaw.nsn-rdnet.net,5g-rep-portal.wroclaw.nsn-rdnet.net,wrling37.emea.nsn-net.net,wrling23.emea.nsn-net.net
ENV HTTPS_PROXY=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV https_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/
ENV ftp_proxy=http://lab-proxy.krk-lab.nsn-rdnet.net:8080/

ENV BACKEND_API_URL=http://web:8000/

WORKDIR /frontend

COPY ./package.json /frontend/
COPY ./package-lock.json /frontend/
RUN npm install

COPY . /frontend/

 