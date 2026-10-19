COMPOSE := docker compose -f deployments/docker-compose.dev.yml
DEV_DATABASE_URL := postgres://wegojuan:wegojuan@localhost:5433/wegojuan?sslmode=disable

.PHONY: dev down logs db air

# api (air hot reload) + postgres ใน docker
dev:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f api

# รันแค่ postgres ไว้ใช้คู่กับ make air
db:
	$(COMPOSE) up -d db

# air บนเครื่อง ต่อ postgres จาก make db
air:
	DATABASE_URL="$(DEV_DATABASE_URL)" air
