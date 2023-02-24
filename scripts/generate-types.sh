#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname $0)/.."

echo "declare const schema: $(cat env.bot.config.json); export default schema;" > env.bot.config.json.d.ts
echo "declare const schema: $(cat env.backend.config.json); export default schema;" > env.backend.config.json.d.ts
echo "declare const schema: $(cat env.bot-backend.config.json); export default schema;" > env.bot-backend.config.json.d.ts
echo "declare const schema: $(cat env.web-backend.config.json); export default schema;" > env.web-backend.config.json.d.ts
