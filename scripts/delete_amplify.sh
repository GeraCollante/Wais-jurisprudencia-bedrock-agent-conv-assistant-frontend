#!/bin/bash

# Nombre del stack
STACK_NAME="webapp"

# Destruir el stack de CloudFormation
aws cloudformation delete-stack --stack-name "$STACK_NAME"

# Esperar hasta que el stack sea completamente eliminado
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo "El stack $STACK_NAME ha sido eliminado exitosamente."
