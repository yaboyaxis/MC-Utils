FROM node:14-alpine

ENV PNPM_VERSION=5.16.0

RUN apk add git python3 g++ make curl pkgconf cairo-dev jpeg-dev pango-dev giflib-dev \
&& curl -L https://unpkg.com/@pnpm/self-installer | node

RUN ln -sf pkgconf /usr/bin/pkg-config

WORKDIR /opt/mc-utils/bot

ENV CXXFLAGS="-w"

COPY services/bot/ ./

RUN pnpm i

RUN pnpm run build

CMD [ "node", ".", "--max-old-space-size=8192" ]