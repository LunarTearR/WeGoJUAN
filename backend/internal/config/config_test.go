package config

import (
	"os"
	"testing"
)

// setEnv ตั้งค่า env ที่ต้องมีเสมอ แล้วล้าง HTTP_ADDR / PORT ที่อาจค้างมาจากเครื่อง
func setEnv(t *testing.T, vars map[string]string) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgres://x")
	t.Setenv("JWT_SECRET", "test-secret-that-is-at-least-32-bytes!!")
	for _, k := range []string{"HTTP_ADDR", "PORT"} {
		t.Setenv(k, "") // ให้ t คืนค่าเดิมตอนจบ test
		os.Unsetenv(k)
	}
	for k, v := range vars {
		t.Setenv(k, v)
	}
}

func TestLoad_HTTPAddr(t *testing.T) {
	tests := []struct {
		name string
		vars map[string]string
		want string
	}{
		{"default", nil, ":8080"},
		{"Railway PORT", map[string]string{"PORT": "7777"}, ":7777"},
		{"explicit HTTP_ADDR wins over PORT", map[string]string{"PORT": "7777", "HTTP_ADDR": ":9000"}, ":9000"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setEnv(t, tt.vars)

			cfg, err := Load()

			if err != nil {
				t.Fatal(err)
			}
			if cfg.HTTPAddr != tt.want {
				t.Errorf("HTTPAddr = %q, want %q", cfg.HTTPAddr, tt.want)
			}
		})
	}
}
