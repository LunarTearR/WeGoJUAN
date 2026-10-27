package config

import "github.com/caarlos0/env/v11"

type Config struct {
	Env            string   `env:"APP_ENV" envDefault:"development"`
	HTTPAddr       string   `env:"HTTP_ADDR"`
	Port           string   `env:"PORT"` // Railway (และ host ส่วนใหญ่) บอก port ผ่าน PORT
	DatabaseURL    string   `env:"DATABASE_URL,required"`
	AllowedOrigins []string `env:"ALLOWED_ORIGINS" envSeparator:","`
	JWTSecret      string   `env:"JWT_SECRET,required"`
}

func Load() (Config, error) {
	cfg, err := env.ParseAs[Config]()
	if err != nil {
		return Config{}, err
	}
	// HTTP_ADDR ตั้งเองมาก่อน ไม่งั้นใช้ PORT ของ host ไม่มีทั้งคู่ใช้ :8080
	if cfg.HTTPAddr == "" {
		cfg.HTTPAddr = ":8080"
		if cfg.Port != "" {
			cfg.HTTPAddr = ":" + cfg.Port
		}
	}
	return cfg, nil
}
