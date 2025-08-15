#!/bin/bash

# Configuración de ReplicaSet MongoDB
# Ejecutar desde el servidor primario

echo "=== CONFIGURACIÓN DE REPLICASET MONGODB ==="

# Variables - CAMBIAR ESTAS IPs POR LAS REALES DE TUS SERVIDORES
PRIMARY_IP="IP_SERVIDOR_PRIMARIO"
SECONDARY1_IP="IP_SERVIDOR_SECUNDARIO_1" 
SECONDARY2_IP="IP_SERVIDOR_SECUNDARIO_2"

echo "Inicializando ReplicaSet en servidor primario..."

# 1. Inicializar ReplicaSet con solo el primario
mongosh --host ${PRIMARY_IP}:27017 -u admin -p password123 --authenticationDatabase admin --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '${PRIMARY_IP}:27017', priority: 2 }
  ]
})
"

echo "Esperando que el primario se configure como PRIMARY..."
sleep 10

# 2. Agregar servidor secundario 1
echo "Agregando servidor secundario 1..."
mongosh --host ${PRIMARY_IP}:27017 -u admin -p password123 --authenticationDatabase admin --eval "
rs.add('${SECONDARY1_IP}:27017')
"

sleep 5

# 3. Agregar servidor secundario 2
echo "Agregando servidor secundario 2..."
mongosh --host ${PRIMARY_IP}:27017 -u admin -p password123 --authenticationDatabase admin --eval "
rs.add('${SECONDARY2_IP}:27017')
"

sleep 10

# 4. Verificar estado del ReplicaSet
echo "Verificando estado del ReplicaSet..."
mongosh --host ${PRIMARY_IP}:27017 -u admin -p password123 --authenticationDatabase admin --eval "
rs.status()
"

echo "¡ReplicaSet configurado exitosamente!"
echo ""
echo "String de conexión:"
echo "mongodb://admin:password123@${PRIMARY_IP}:27017,${SECONDARY1_IP}:27017,${SECONDARY2_IP}:27017/tu-database?replicaSet=rs0&authSource=admin"
