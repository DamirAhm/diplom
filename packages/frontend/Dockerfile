FROM node:alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG API_URL=http://backend:8080/api

# Convert ARGs to ENVs so Next.js can access them during build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL

COPY . .

RUN yarn install --immutable

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"] 