FROM node:9
RUN apt-get update -y
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev -y
WORKDIR /usr/src/app
ADD package.json package.json
RUN npm install
ADD . .
ENTRYPOINT npm start
