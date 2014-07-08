#!/bin/bash

rm /vagrant/application/sockbit.sqlite3
sqlite3 /vagrant/application/sockbit.sqlite3 < /vagrant/application/data/note.sql
cd ~
curl -sS https://getcomposer.org/installer | php
cd /vagrant/application && ~/composer.phar install
cd /vagrant && npm install

