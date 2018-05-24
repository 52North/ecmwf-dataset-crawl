FROM node:8

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

ENV NODE_ENV production
ENV API_PORT 9000
ENV ELASTIC_HOST elasticsearch:9200
ENV ELASTIC_LOGLEVEL info

EXPOSE $API_PORT

CMD ["yarn", "start"]
