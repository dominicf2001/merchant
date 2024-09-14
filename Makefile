.PHONY: bot api ui start

bot: 
	pm2 start src/index.ts --interpreter bun --name "merchant-bot" &

api: 
	pm2 start src/api/api.ts --interpreter bun --name "merchant-api" &

start: bot api 

