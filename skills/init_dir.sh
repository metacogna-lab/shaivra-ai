#!/bin/bash

ROOT="shaivra-intelligence"

mkdir -p $ROOT
cd $ROOT

mkdir -p skills/{lens-intelligence,forge-influence,shield-counterintel,orchestrator}

mkdir -p skills/lens-intelligence/{scripts,references,assets}
mkdir -p skills/forge-influence/{scripts,references}
mkdir -p skills/shield-counterintel/{scripts,references}
mkdir -p skills/orchestrator/references

mkdir -p langgraph/{nodes,tools,schemas}

mkdir -p infra/{docker,terraform,observability}

touch CLAUDE.md
touch README.md
touch docker-compose.yml
touch Makefile

echo "Repository structure created."