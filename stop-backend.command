#!/bin/bash

echo "Looking for running Node.js backend processes..."
echo "----------------------------------------"

# Find and display Node.js processes running server.js
PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "No backend server processes found."
else
    echo "Found backend server process(es):"
    ps aux | grep "node server.js" | grep -v grep
    echo "----------------------------------------"
    echo "Stopping backend server process(es)..."
    
    # Kill the processes
    for PID in $PIDS; do
        kill $PID
        echo "Stopped process $PID"
    done
    
    echo "Backend server stopped."
fi

echo "----------------------------------------"
echo "Press any key to close this window..."
read -n 1 