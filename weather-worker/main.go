package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
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

// Variável global para armazenar a URL da API (será definida no main)
var apiURL string

func failOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

// Função auxiliar para ler variáveis de ambiente com valor padrão
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
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
		log.Printf("❌ Erro ao enviar para API (%s): %v", apiURL, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("✅ Sucesso! Dados salvos na API. Status: %d", resp.StatusCode)
	} else {
		log.Printf("⚠️ API retornou erro: Status %d", resp.StatusCode)
	}
}

func main() {
	// 1. Configuração Dinâmica (Docker vs Local)
	// Se estiver no Docker, usará os nomes dos serviços. Se local, usa localhost.
	rabbitURL := getEnv("RABBITMQ_URL", "amqp://user:password@rabbitmq:5672/")
	
	// Configura a URL base da API
	const apiURL = "http://weather-api:3000/weather"

	log.Printf("🔌 Conectando ao RabbitMQ em: %s", rabbitURL)
	log.Printf("📡 API alvo configurada para: %s", apiURL)

	// 2. Conectar ao RabbitMQ com Retry (importante para Docker, pois o Rabbit pode demorar a subir)
	var conn *amqp.Connection
	var err error

	// Tenta conectar 5 vezes antes de desistir
	for i := 0; i < 5; i++ {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			break
		}
		log.Printf("⚠️ Falha ao conectar (tentativa %d/5). Retentando em 2s...", i+1)
		time.Sleep(2 * time.Second)
	}
	failOnError(err, "Falha ao conectar ao RabbitMQ após várias tentativas")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir um canal")
	defer ch.Close()

	// 3. Garantir que a fila existe
	q, err := ch.QueueDeclare(
		"weather_data", // nome da fila
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		nil,            // arguments
	)
	failOnError(err, "Falha ao declarar a fila")

	// 4. Configurar o consumidor
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

	// 5. Loop infinito de processamento
	forever := make(chan struct{})

	go func() {
		for d := range msgs {
			log.Printf("📥 Recebido da fila: %s", d.Body)

			// Validar se é um JSON válido
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