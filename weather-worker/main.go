package main

import (
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// WeatherData define a estrutura do JSON que vem do Python
// As "tags" `json:"..."` ensinam o Go a mapear os campos
type WeatherData struct {
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	TempC         float64 `json:"temp_c"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"wind_speed"`
	ConditionCode int     `json:"condition_code"`
	Timestamp     string  `json:"timestamp"`
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

func main() {
	// 1. Conectar ao RabbitMQ
	// No Codespaces, localhost funciona se o container estiver rodando e mapeado
	connStr := "amqp://user:password@localhost:5672/"
	conn, err := amqp.Dial(connStr)
	failOnError(err, "Falha ao conectar ao RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir um canal")
	defer ch.Close()

	// 2. Garantir que a fila existe (igual fizemos no Python)
	q, err := ch.QueueDeclare(
		"weather_data", // nome da fila
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		nil,            // arguments
	)
	failOnError(err, "Falha ao declarar a fila")

	// 3. Configurar o consumidor
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer tag (vazio = auto gerado)
		true,   // auto-ack (true = confirma recebimento automaticamente)
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Falha ao registrar o consumidor")

	// 4. Loop infinito para ler mensagens
	var forever chan struct{}

	go func() {
		for d := range msgs {
			// A mensagem chega como array de bytes (d.Body)
			log.Printf("Recebido: %s", d.Body)

			// Vamos tentar converter (unmarshal) para nossa struct só para testar
			var data WeatherData
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("Erro ao decodificar JSON: %v", err)
				continue
			}

			// Aqui é onde, futuramente, enviaremos para o NestJS
			log.Printf("Processado: Temperatura de %.1f°C em %s", data.TempC, data.Timestamp)
		}
	}()

	log.Printf(" [*] Aguardando mensagens. Para sair pressione CTRL+C")
	<-forever
}