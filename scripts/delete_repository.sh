#!/bin/bash

# Variables
REPO_NAME="mx225192-bedrock-agent-conv-assistant-frontend"

# Validate the input parameter
if [[ -z "$REPO_NAME" ]]; then
    echo "Error: REPO_NAME is not specified."
    exit 1
fi

# Run the AWS CLI command to delete the CodeCommit repository
echo "Deleting AWS CodeCommit repository..."
aws codecommit delete-repository --repository-name "$REPO_NAME"

# Check if the command was successful
if [[ $? -ne 0 ]]; then
    echo "Failed to delete the repository."
    exit 1
fi

echo "Repository $REPO_NAME deleted successfully."
