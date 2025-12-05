FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# '--host' para acessar o frontend fora do docker
CMD ["npm", "run", "dev", "--", "--host"]