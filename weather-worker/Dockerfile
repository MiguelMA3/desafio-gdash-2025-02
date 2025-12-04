# Estágio de Compilação
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copia as dependências e baixa
COPY go.mod go.sum ./
RUN go mod download

# Copia o código e compila
COPY . .
RUN go build -o worker main.go

# Estágio Final (Execução leve)
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/worker .

# Comando para rodar o binário
CMD ["./worker"]