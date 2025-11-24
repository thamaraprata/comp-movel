#!/bin/bash

# Script para configurar InfluxDB 2.x
# Cria organização, bucket e token

INFLUXDB_URL="http://localhost:8086"
ADMIN_TOKEN="my-super-secret-token"
ORG_NAME="myorg"
BUCKET_NAME="weather"
RETENTION_DAYS="30"

echo "Aguardando InfluxDB iniciar..."
sleep 15

echo "Configurando InfluxDB..."

# Criar organização
echo "Criando organização..."
influx org create \
  --name $ORG_NAME \
  --description "Organização para monitoramento ambiental" \
  --host $INFLUXDB_URL \
  --token $ADMIN_TOKEN 2>/dev/null || echo "Organização já existe"

# Obter ID da organização
ORG_ID=$(influx org list \
  --host $INFLUXDB_URL \
  --token $ADMIN_TOKEN \
  --format json | jq -r ".[] | select(.name==\"$ORG_NAME\") | .id")

echo "Organization ID: $ORG_ID"

# Criar bucket
echo "Criando bucket..."
influx bucket create \
  --name $BUCKET_NAME \
  --description "Dados de clima e sensores" \
  --org $ORG_NAME \
  --retention $((RETENTION_DAYS*24))h \
  --host $INFLUXDB_URL \
  --token $ADMIN_TOKEN 2>/dev/null || echo "Bucket já existe"

# Criar token para acesso
echo "Criando token de acesso..."
TOKEN=$(influx auth create \
  --org $ORG_NAME \
  --description "Token para Node-RED e Backend" \
  --host $INFLUXDB_URL \
  --token $ADMIN_TOKEN \
  --write-buckets $BUCKET_NAME \
  --read-buckets $BUCKET_NAME \
  --format json 2>/dev/null | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Erro ao criar token. Use a interface web do InfluxDB para criar manualmente."
  echo "Acesse: http://localhost:8086"
  echo "Usuário: admin"
  echo "Senha: admin123456"
else
  echo "Token criado com sucesso: $TOKEN"
  echo "Salve este token em um local seguro!"
fi

echo "Configuração concluída!"
