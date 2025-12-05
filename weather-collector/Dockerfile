# Use uma imagem leve do Python
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
# Instala dependências sem cache para reduzir o tamanho final da imagem.
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]