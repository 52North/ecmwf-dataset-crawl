FROM node:10-alpine as build

WORKDIR /usr/src
COPY yarn.lock package.json ./
RUN yarn
COPY . .
ENV API_URL ./api
ENV KIBANA_URL ./kibana
RUN yarn build

FROM busybox:latest
COPY --from=build /usr/src/dist /dist
CMD /bin/true
