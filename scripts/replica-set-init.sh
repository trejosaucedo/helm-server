#!/bin/bash

echo "Esperando que los contenedores de MongoDB estén listos..."
sleep 15

echo "Inicializando ReplicaSet..."

mongosh --host mongo1:27017 -u admin -p password123 --authenticationDatabase admin --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
'

echo "Esperando que el ReplicaSet se configure..."
sleep 10

echo "Verificando estado del ReplicaSet..."
mongosh --host mongo1:27017 -u admin -p password123 --authenticationDatabase admin --eval 'rs.status()'

echo "¡ReplicaSet configurado exitosamente!"
