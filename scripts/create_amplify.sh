#!/bin/bash
cd ..

# Nombre del stack
STACK_NAME="webapp"

# Archivo de plantilla de CloudFormation
TEMPLATE_FILE="template.yaml"

# Archivo de parámetros
PARAMETERS_FILE="parameters.json"

# Desplegar con CloudFormation
aws cloudformation deploy --stack-name "$STACK_NAME" \
       --template-file "$TEMPLATE_FILE" --capabilities CAPABILITY_IAM \
       --parameter-overrides file://"$PARAMETERS_FILE"
