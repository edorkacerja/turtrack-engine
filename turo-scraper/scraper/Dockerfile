FROM zenika/alpine-chrome:with-puppeteer

USER 0
RUN apk add --no-cache xvfb

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 5001
EXPOSE 9229

CMD ["node", "--inspect=0.0.0.0:9229", "./src/server.js"]
