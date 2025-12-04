FROM node:18-alpine

WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Gera a pasta 'dist' (build)
RUN npm run build

# Porta que o NestJS usa
EXPOSE 3000

# Roda a aplicação compilada
CMD ["npm", "run", "start:prod"]