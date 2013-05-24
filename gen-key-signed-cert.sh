#!/bin/bash

# require root
if [ $USER != "root" ]
then 
	echo "$0: error: must be root" && exit 2
fi

# if the length of $1 is not zero
if [ $1 ]
then
	# set serverName to $1
	serverName=$1
else
	# set serverName to default: "adminion"
	serverName="adminion"
fi

# ouput the server name to be used
#echo "server name: $serverName"

key=".ssl/$serverName-key.pem"
csr=".ssl/$serverName-csr.pem"
cert=".ssl/$serverName-cert.pem"

echo "generating $key...";
openssl genrsa -out $key

echo "generating $csr..."
openssl req -new -key $key -out $csr

echo "self-signing $cert..."
openssl x509 -req -days 9999 -in $csr -signkey $key -out $cert

echo "removing $csr..."
rm $csr

echo "successfully generated $key, self-signed $cert from $csr."
