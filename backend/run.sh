#!/bin/bash
set -e

echo "🚀 Setting up local Python environment..."

# Detect Python version
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo "❌ Python not found. Please install Python 3."
    exit 1
fi

echo "📦 Using $PYTHON_CMD..."

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "✅ Virtual environment created."
fi

# Activate and install
source venv/bin/activate || true

# Use the venv python explicitly for reliability
VENV_PYTHON="venv/bin/python3"

echo "🛠 Updating pip and dependencies..."
$VENV_PYTHON -m pip install --upgrade pip
$VENV_PYTHON -m pip install -r requirements.txt

echo "📡 Starting FastAPI server on port 8001..."
$VENV_PYTHON main.py
