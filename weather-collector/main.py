import time
import json
import os
import requests
import pika
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Configurações
RABBIT_HOST = os.getenv('RABBITMQ_HOST')
RABBIT_PORT = int(os.getenv('RABBITMQ_PORT'))
RABBIT_USER = os.getenv('RABBITMQ_USER')
RABBIT_PASS = os.getenv('RABBITMQ_PASS')
QUEUE_NAME = os.getenv('QUEUE_NAME')

LATITUDE = os.getenv('LATITUDE')
LONGITUDE = os.getenv('LONGITUDE')

def get_weather_data():
    """Busca dados da API Open-Meteo"""
    try:
        print("Buscando dados climáticos...")
        # URL da Open-Meteo pedindo temperatura, humidade, vento e código do tempo
        url = f"https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status() # Lança erro se a requisição falhar
        data = response.json()
        
        # Extraindo e normalizando os dados para o formato que queremos
        current = data.get('current', {})
        
        payload = {
            "latitude": float(LATITUDE),
            "longitude": float(LONGITUDE),
            "temp_c": current.get('temperature_2m'),
            "humidity": current.get('relative_humidity_2m'),
            "wind_speed": current.get('wind_speed_10m'),
            "condition_code": current.get('weather_code'), # Código numérico do clima (WMO)
            "timestamp": current.get('time') # Horário da coleta
        }
        
        return payload
    except requests.exceptions.ReadTimeout as e:
        print(f"Erro de Timeout de Leitura: O servidor da API demorou mais que 10 segundos para responder. {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return None
    except Exception as e:
        print(f"Erro inesperado ao buscar dados: {e}")
        return None

def send_to_queue(payload):
    """Envia o JSON para o RabbitMQ"""
    try:
        # Conexão com o RabbitMQ
        credentials = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
        parameters = pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT, credentials=credentials)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Garante que a fila existe
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        # Transforma o dicionário em JSON string
        message_body = json.dumps(payload)

        # Publica
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=message_body,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Torna a mensagem persistente
            )
        )
        print(f"Dados enviados para a fila '{QUEUE_NAME}': {message_body}")
        
        connection.close()
    except Exception as e:
        print(f"Erro ao conectar/enviar para o RabbitMQ: {e}")

def main():
    print("Iniciando coletor de clima...")
    
    while True:
        data = get_weather_data()
        
        if data:
            send_to_queue(data)
        
        # O desafio pede "periodicamente". Para teste rápido, coloquei 30 segundos.
        # No produção real, poderia ser 1 hora (3600 segundos).
        print("Aguardando próxima coleta...")
        time.sleep(900)

if __name__ == "__main__":
    main()