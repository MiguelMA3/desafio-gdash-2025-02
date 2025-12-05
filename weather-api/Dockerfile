# Usando a imagem Node.js 18 baseada em Alpine para um tamanho de container reduzido.
FROM node:18-alpine

WORKDIR /app

# Copia package.json e instala dependências
# Isso aproveita o cache do Docker se as dependências não mudarem.
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Porta padrão de execução do NestJS
EXPOSE 3000

CMD ["npm", "run", "start:prod"]