#!/bin/bash

# Variables
REPO_NAME="mx225192-bedrock-agent-conv-assistant-frontend"
REPO_DESCRIPTION="Frontend code for the Bedrock Conversational Assistant"
OUTPUT_FILE="create_repository_output.txt"

# Validate the input parameters
if [[ -z "$REPO_NAME" ]]; then
    echo "Error: REPO_NAME is not specified."
    exit 1
fi

if [[ -z "$REPO_DESCRIPTION" ]]; then
    echo "Error: REPO_DESCRIPTION is not specified."
    exit 1
fi

# Run the AWS CLI command to create the CodeCommit repository and save the output
echo "Creating AWS CodeCommit repository..."
aws codecommit create-repository --repository-name "$REPO_NAME" --repository-description "$REPO_DESCRIPTION" > "$OUTPUT_FILE" 2>&1

# Check if the command was successful
if [[ $? -ne 0 ]]; then
    echo "Failed to create the repository. Check the output file for details: $OUTPUT_FILE"
    exit 1
fi

echo "Repository $REPO_NAME created successfully. See details in $OUTPUT_FILE."
