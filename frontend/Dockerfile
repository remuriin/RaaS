# The web app as a container image: the built files inside a small web server.
#
# Two stages. The first builds the app; it is thrown away afterwards, so node_modules never ship.
# The second is the image that runs: nginx plus the built files, nothing else.

# --platform=$BUILDPLATFORM: build on whatever machine is doing the building (GitHub's are x86),
# at full speed. Only the final stage has to be ARM, and it runs no commands, it only receives files.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

# the dependency list first, on its own: Docker reuses this step as long as it has not changed
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The Firebase web config. These are public identifiers that end up inside the built files anyway;
# they come in as build arguments because .env is not in the repository (and not in this build, see .dockerignore).
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
RUN npm run build

# nginx that does not run as root, listening on 8080
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
