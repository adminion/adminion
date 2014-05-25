#!/bin/bash

# require root
if [ $USER != "root" ]
then 
	echo "$0: error: must be root" && exit 2
fi

echo "Starting Adminion game server..."

DEBUG=socket.io:* nodejs server.js
