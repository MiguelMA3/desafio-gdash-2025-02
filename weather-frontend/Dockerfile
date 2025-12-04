FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# '--host' é essencial para acessar o frontend fora do docker
CMD ["npm", "run", "dev", "--", "--host"]