package config

import "github.com/caarlos0/env/v11"

type Config struct {
	Env            string   `env:"APP_ENV" envDefault:"development"`
	HTTPAddr       string   `env:"HTTP_ADDR" envDefault:":8080"`
	DatabaseURL    string   `env:"DATABASE_URL,required"`
	AllowedOrigins []string `env:"ALLOWED_ORIGINS" envSeparator:","`
	JWTSecret      string   `env:"JWT_SECRET,required"`
}

func Load() (Config, error) {
	return env.ParseAs[Config]()
}
