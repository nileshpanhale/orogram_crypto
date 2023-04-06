#!/bin/bash
ln -s /etc/apache2/sites-available/app.conf /etc/apache2/sites-enabled/
#cp /var/www/html/.htaccess /var/www/html/dist/fuse/
chmod -R 777 /var/www/html
a2dissite 000-default.conf
a2ensite app.conf
a2enmod rewrite
a2dismod mpm_event && a2enmod mpm_prefork
a2enmod headers
cd server
npm install
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_balancer
a2enmod lbmethod_byrequests
#npm install @angular/cli -g
#npm install node-sass
#ng build
#cp /var/www/html/.htaccess /var/www/html/dist/fuse/
#php artisan key:gen
service apache2 start
#service apache2 restart
#tail /var/log/apache/error.log
while true; do sleep 1d; done
