# Build step
FROM node:18-bullseye AS build
WORKDIR /app
COPY . .
RUN rm -rf node_modules package-lock.json
RUN npm install
RUN npm rebuild rollup
RUN npm run build

# Serve step
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf