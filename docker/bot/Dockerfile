FROM node:alpine

RUN apk add git python g++ make pkgconf cairo-dev jpeg-dev pango-dev giflib-dev

RUN ln -sf pkgconf /usr/bin/pkg-config

WORKDIR /opt/mc-utils/bot

ENV CXXFLAGS="-w"

COPY services/bot/ ./

RUN npm i
RUN npm run build

CMD [ "node", ".", "--max-old-space-size=8192" ]