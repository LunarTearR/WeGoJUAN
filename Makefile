COMPOSE := docker compose -f docker-compose.dev.yml

.PHONY: dev down logs db air

# api (air hot reload) + postgres ใน docker
dev:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f api

# รัน postgres + migrate ไว้ใช้คู่กับ make air
db:
	$(COMPOSE) up -d --wait db
	$(COMPOSE) run --rm migrate

# air บนเครื่อง ต่อ postgres จาก make db — อ่าน env จาก backend/.env
air:
	cd backend && set -a && . ./.env && set +a && air
