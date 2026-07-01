FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.26-alpine AS backend
WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go build -o f1-apex .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend /app/f1-apex .
COPY --from=frontend /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./f1-apex"]
