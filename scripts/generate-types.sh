#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname $0)/.."

echo "declare const schema: $(cat env.server.config.json); export default schema;" > env.server.config.json.d.ts
echo "declare const schema: $(cat env.bot.config.json); export default schema;" > env.bot.config.json.d.ts
