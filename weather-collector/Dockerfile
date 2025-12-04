# Use uma imagem leve do Python
FROM python:3.9-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de requisitos e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte (main.py, .env, etc)
COPY . .

# Comando para rodar o script
CMD ["python", "main.py"]