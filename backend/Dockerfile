# Production image (Railway): build Go binary + goose แล้วรัน migration ก่อนเปิด API ทุกครั้งที่ start
# dev ใช้ Dockerfile.dev (air hot reload) แทน
FROM golang:1.26.2 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOBIN=/out go install github.com/pressly/goose/v3/cmd/goose@v3.28.0

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && adduser -D -H app
WORKDIR /app
COPY --from=build /out/api /out/goose ./
COPY migrations ./migrations
USER app
ENV APP_ENV=production
# goose up ไม่ทำอะไรถ้า migrate ครบแล้ว — ถ้า migrate ล้ม container ไม่เปิด API (deploy นั้นไม่ขึ้น)
CMD ["sh", "-c", "./goose -dir migrations postgres \"$DATABASE_URL\" up && exec ./api"]
