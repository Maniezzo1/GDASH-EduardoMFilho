package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherData struct {
	Timestamp     string  `json:"timestamp"`
	Location      string  `json:"location"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Temperature   float64 `json:"temperature"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"wind_speed"`
	Precipitation float64 `json:"precipitation"`
	WeatherCode   int     `json:"weather_code"`
	Condition     string  `json:"condition"`
}

type Config struct {
	RabbitMQURL  string
	NestJSAPIURL string
	QueueName    string
}

func main() {
	config := Config{
		RabbitMQURL:  getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		NestJSAPIURL: getEnv("NESTJS_API_URL", "http://localhost:3000"),
		QueueName:    getEnv("QUEUE_NAME", "weather_data"),
	}

	log.Println("[Go Worker] Starting Weather Worker...")
	log.Printf("[Go Worker] RabbitMQ URL: %s\n", config.RabbitMQURL)
	log.Printf("[Go Worker] NestJS API URL: %s\n", config.NestJSAPIURL)
	log.Printf("[Go Worker] Queue Name: %s\n", config.QueueName)

	// Connect to RabbitMQ with retry
	conn, err := connectWithRetry(config.RabbitMQURL, 5, 5*time.Second)
	if err != nil {
		log.Fatalf("[Go Worker] Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[Go Worker] Failed to open channel: %v", err)
	}
	defer ch.Close()

	// Declare queue
	q, err := ch.QueueDeclare(
		config.QueueName, // name
		true,             // durable
		false,            // delete when unused
		false,            // exclusive
		false,            // no-wait
		nil,              // arguments
	)
	if err != nil {
		log.Fatalf("[Go Worker] Failed to declare queue: %v", err)
	}

	// Set QoS
	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	if err != nil {
		log.Fatalf("[Go Worker] Failed to set QoS: %v", err)
	}

	// Consume messages
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("[Go Worker] Failed to register consumer: %v", err)
	}

	log.Println("[Go Worker] Waiting for messages...")

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			log.Printf("[Go Worker] Received message: %s\n", d.Body)

			// Parse weather data
			var weatherData WeatherData
			err := json.Unmarshal(d.Body, &weatherData)
			if err != nil {
				log.Printf("[Go Worker] Error parsing JSON: %v\n", err)
				d.Nack(false, false) // Don't requeue invalid messages
				continue
			}

			// Validate data
			if !isValid(weatherData) {
				log.Println("[Go Worker] Invalid weather data, discarding...")
				d.Nack(false, false)
				continue
			}

			// Send to NestJS API
			success := sendToAPI(config.NestJSAPIURL, weatherData)
			if success {
				log.Println("[Go Worker] Successfully sent data to API")
				d.Ack(false)
			} else {
				log.Println("[Go Worker] Failed to send data to API, requeuing...")
				d.Nack(false, true) // Requeue for retry
			}
		}
	}()

	<-forever
}

func connectWithRetry(url string, maxRetries int, delay time.Duration) (*amqp.Connection, error) {
	var conn *amqp.Connection
	var err error

	for i := 0; i < maxRetries; i++ {
		log.Printf("[Go Worker] Attempting to connect to RabbitMQ (attempt %d/%d)...\n", i+1, maxRetries)
		conn, err = amqp.Dial(url)
		if err == nil {
			log.Println("[Go Worker] Successfully connected to RabbitMQ")
			return conn, nil
		}

		log.Printf("[Go Worker] Failed to connect: %v\n", err)
		if i < maxRetries-1 {
			log.Printf("[Go Worker] Retrying in %v...\n", delay)
			time.Sleep(delay)
		}
	}

	return nil, fmt.Errorf("failed to connect after %d attempts: %w", maxRetries, err)
}

func isValid(data WeatherData) bool {
	if data.Location == "" {
		return false
	}
	if data.Timestamp == "" {
		return false
	}
	// Add more validation as needed
	return true
}

func sendToAPI(apiURL string, data WeatherData) bool {
	url := fmt.Sprintf("%s/api/weather/logs", apiURL)

	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("[Go Worker] Error marshaling data: %v\n", err)
		return false
	}

	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("[Go Worker] HTTP request error (attempt %d/%d): %v\n", i+1, maxRetries, err)
			time.Sleep(2 * time.Second)
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("[Go Worker] API Response: %d - %s\n", resp.StatusCode, string(body))
			return true
		}

		log.Printf("[Go Worker] API Error: %d - %s (attempt %d/%d)\n", resp.StatusCode, string(body), i+1, maxRetries)
		time.Sleep(2 * time.Second)
	}

	return false
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
