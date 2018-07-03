#!/bin/bash
echo "Building Dockerfile..."

if [ -z "${1}" ]; then
   version="latest"
else
   version="${1}"
fi

docker build -t genny-project/signatures:${version} .
