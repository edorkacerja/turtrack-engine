FROM zenika/alpine-chrome:with-puppeteer

USER 0
RUN apk add --no-cache xvfb

ENV DISPLAY :99

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 5001
EXPOSE 9229

# Ensure the entrypoint script is executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

CMD ["node", "--inspect=0.0.0.0:9229", "src/server.js"]
