package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// WeatherData define a estrutura do JSON que vem do Python
type WeatherData struct {
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	TempC         float64 `json:"temp_c"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"wind_speed"`
	ConditionCode int     `json:"condition_code"`
	Timestamp     string  `json:"timestamp"`
}

// URL da API NestJS (rodando localmente na porta 3000)
// Se estivesse dentro do Docker, seria http://weather-api:3000/weather,
// mas como você está rodando no terminal, localhost funciona.
const apiURL = "http://localhost:3000/weather"

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

// Função para enviar os dados para a API NestJS
func sendToAPI(data []byte) {
	// Cria uma requisição POST com o JSON recebido da fila
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(data))
	if err != nil {
		log.Printf("❌ Erro ao criar requisição: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Cliente HTTP com timeout para não travar o worker se a API cair
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Erro ao enviar para API: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("✅ Sucesso! Dados salvos na API (Status: %d)", resp.StatusCode)
	} else {
		log.Printf("⚠️ API retornou erro: Status %d", resp.StatusCode)
	}
}

func main() {
	// 1. Conectar ao RabbitMQ
	connStr := "amqp://user:password@localhost:5672/"
	conn, err := amqp.Dial(connStr)
	failOnError(err, "Falha ao conectar ao RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir um canal")
	defer ch.Close()

	// 2. Garantir que a fila existe
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
		"",     // consumer tag
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Falha ao registrar o consumidor")

	// 4. Loop infinito
	var forever chan struct{}

	go func() {
		for d := range msgs {
			log.Printf("📥 Recebido da fila: %s", d.Body)

			// Validar se é um JSON válido (opcional, mas bom pra segurança)
			var data WeatherData
			err := json.Unmarshal(d.Body, &data)
			if err != nil {
				log.Printf("❌ JSON inválido, ignorando: %v", err)
				continue
			}

			// Enviar para a API NestJS
			sendToAPI(d.Body)
		}
	}()

	log.Printf(" [*] Worker Go rodando. Aguardando mensagens...")
	<-forever
}