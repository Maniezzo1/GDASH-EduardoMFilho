import os
import json
import time
import logging
import requests
import pika
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WeatherCollector:
    def __init__(self):
        self.rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')
        self.queue_name = os.getenv('QUEUE_NAME', 'weather_data')
        self.weather_api_url = os.getenv('WEATHER_API_URL', 'https://api.open-meteo.com/v1/forecast')
        self.latitude = float(os.getenv('LATITUDE', '40.7128'))
        self.longitude = float(os.getenv('LONGITUDE', '-74.0060'))
        self.location_name = os.getenv('LOCATION_NAME', 'New York')
        self.collection_interval = int(os.getenv('COLLECTION_INTERVAL', '3600'))
        
        self.connection = None
        self.channel = None
        
    def connect_rabbitmq(self):
        """Establish connection to RabbitMQ"""
        max_retries = 5
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to RabbitMQ (attempt {attempt + 1}/{max_retries})...")
                parameters = pika.URLParameters(self.rabbitmq_url)
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                
                # Declare queue
                self.channel.queue_declare(queue=self.queue_name, durable=True)
                logger.info(f"Connected to RabbitMQ successfully. Queue: {self.queue_name}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to connect to RabbitMQ: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    logger.error("Max retries reached. Exiting...")
                    return False
    
    def fetch_weather_data(self) -> Dict[str, Any]:
        """Fetch weather data from Open-Meteo API"""
        try:
            params = {
                'latitude': self.latitude,
                'longitude': self.longitude,
                'current': 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
                'hourly': 'temperature_2m,precipitation_probability',
                'timezone': 'auto'
            }
            
            logger.info(f"Fetching weather data for {self.location_name}...")
            response = requests.get(self.weather_api_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            current = data.get('current', {})
            
            # Map weather codes to conditions
            weather_code = current.get('weather_code', 0)
            condition = self._get_weather_condition(weather_code)
            
            weather_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'location': self.location_name,
                'latitude': self.latitude,
                'longitude': self.longitude,
                'temperature': current.get('temperature_2m'),
                'humidity': current.get('relative_humidity_2m'),
                'wind_speed': current.get('wind_speed_10m'),
                'precipitation': current.get('precipitation', 0),
                'weather_code': weather_code,
                'condition': condition,
            }
            
            logger.info(f"Weather data collected: {weather_data['condition']}, {weather_data['temperature']}°C")
            return weather_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch weather data: {e}")
            return None
        except Exception as e:
            logger.error(f"Error processing weather data: {e}")
            return None
    
    def _get_weather_condition(self, code: int) -> str:
        """Map weather code to human-readable condition"""
        if code == 0:
            return 'clear'
        elif code in [1, 2, 3]:
            return 'partly_cloudy'
        elif code in [45, 48]:
            return 'foggy'
        elif code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
            return 'rainy'
        elif code in [71, 73, 75, 77, 85, 86]:
            return 'snowy'
        elif code in [95, 96, 99]:
            return 'stormy'
        else:
            return 'unknown'
    
    def publish_to_queue(self, weather_data: Dict[str, Any]):
        """Publish weather data to RabbitMQ"""
        try:
            if not self.channel or self.connection.is_closed:
                logger.warning("RabbitMQ connection lost. Reconnecting...")
                self.connect_rabbitmq()
            
            message = json.dumps(weather_data)
            
            self.channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            
            logger.info(f"Weather data published to queue: {self.queue_name}")
            
        except Exception as e:
            logger.error(f"Failed to publish to queue: {e}")
            # Try to reconnect
            self.connect_rabbitmq()
    
    def run(self):
        """Main loop to collect and publish weather data"""
        logger.info("Starting Weather Collector...")
        logger.info(f"Location: {self.location_name} ({self.latitude}, {self.longitude})")
        logger.info(f"Collection interval: {self.collection_interval} seconds")
        
        if not self.connect_rabbitmq():
            logger.error("Failed to initialize RabbitMQ connection. Exiting...")
            return
        
        try:
            while True:
                weather_data = self.fetch_weather_data()
                
                if weather_data:
                    self.publish_to_queue(weather_data)
                else:
                    logger.warning("No weather data to publish")
                
                logger.info(f"Waiting {self.collection_interval} seconds until next collection...")
                time.sleep(self.collection_interval)
                
        except KeyboardInterrupt:
            logger.info("Shutting down Weather Collector...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("RabbitMQ connection closed")


if __name__ == '__main__':
    collector = WeatherCollector()
    collector.run()
