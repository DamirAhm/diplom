FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG API_URL=http://backend:8080/api

COPY . .

RUN yarn install --immutable

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"] 