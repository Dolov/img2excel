FROM public.ecr.aws/lambda/nodejs:18 as base
# WORKDIR /app
COPY node_modules ./node_modules
COPY dist package*.json .env ./
# RUN npm install
FROM base

CMD ["app.handler"]