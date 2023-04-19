FROM node:16-alpine AS base
WORKDIR /app
COPY . ./
RUN npm i pnpm -g && pnpm i

EXPOSE 3000
CMD [ "npm", "run", "prd" ]