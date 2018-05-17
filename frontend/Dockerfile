FROM node:8-alpine as build

WORKDIR /usr/src
COPY yarn.lock package.json ./
RUN yarn
COPY . .
RUN yarn build

FROM busybox:latest
COPY --from=build /usr/src/dist /dist
CMD /bin/true
