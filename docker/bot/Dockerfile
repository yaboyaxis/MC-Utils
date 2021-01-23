FROM node:14.15.4-alpine3.12

RUN apk add git python3 g++ make pkgconf cairo-dev jpeg-dev pango-dev giflib-dev

RUN ln -sf pkgconf /usr/bin/pkg-config

WORKDIR /opt/mc-utils/bot

ENV CXXFLAGS="-w"

COPY services/bot/ ./

RUN npm i -g pnpm
RUN pnpm i
RUN npm run build

CMD [ "node", ".", "--max-old-space-size=8192" ]