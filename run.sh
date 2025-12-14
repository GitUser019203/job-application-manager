#!/bin/bash
set -x

source .venv/bin/activate
node server.js &
serve -s build --ssl-cert 'server.crt' --ssl-key 'server.key' --listen 3000 