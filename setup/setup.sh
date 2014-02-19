#!/bin/bash

gen=./gen-key-signed-cert.sh

# require root
if [ $USER != "root" ]
then 
	echo "$0: error: must be root" && exit 2
fi

# if argument 1...
case $1 in 
	-g)
		gen $2	
		;;
	--generate)
		gen $2	
		;;
	-s)
		gen $2	
		;;
	--ssl)
		gen $2	
		;;
	--uninstall)
		rm /bin/adminion
		exit
		;;
	*)
		echo "$0: error: unrecognized argument '$1'"
esac

# install ubuntu package dependencies
apt-get update && apt-get install openssl nodejs npm mongodb 

# install node module dependencies
npm install

# preparing to create a symbolic link to the current install within /bin
cwd=`pwd`
foo="$cwd/adminion.sh"

ln -s $foo /bin/adminion

echo "That's it! If all went well, you should be able to start your server!

# adminion.sh
"
