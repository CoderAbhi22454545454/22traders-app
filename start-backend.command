#!/bin/bash

# Source NVM to ensure Node.js is available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Change to the backend directory
cd /Users/akashmohalkar/Desktop/FX_MAIN/backend

echo "Starting backend server..."
echo "Server will run continuously. Press Ctrl+C to stop the server."
echo "----------------------------------------"

# Start the backend directly with Node.js
/Users/akashmohalkar/.nvm/versions/node/v20.17.0/bin/node server.js 