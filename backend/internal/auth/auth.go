// Package auth ดูแล login session: ออก JWT เก็บใน httpOnly cookie และ middleware ตรวจสิทธิ์
package auth

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

const CookieName = "access_token"

const minSecretLen = 32

var ErrSecretTooShort = errors.New("jwt secret must be at least 32 bytes")

type userIDKey struct{}

type Manager struct {
	secret       []byte
	ttl          time.Duration
	secureCookie bool
}

// NewManager — secureCookie ควรเป็น true ทุก env ที่ไม่ใช่ development (ต้องใช้ HTTPS)
func NewManager(secret string, ttl time.Duration, secureCookie bool) (*Manager, error) {
	if len(secret) < minSecretLen {
		return nil, ErrSecretTooShort
	}
	return &Manager{secret: []byte(secret), ttl: ttl, secureCookie: secureCookie}, nil
}

// Login ออก token ให้ userID แล้วตั้ง cookie ใน response
func (m *Manager) Login(c fiber.Ctx, userID string) error {
	now := time.Now()
	expires := now.Add(m.ttl)
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   userID,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(expires),
	}).SignedString(m.secret)
	if err != nil {
		return err
	}

	c.Cookie(m.cookie(token, expires))
	return nil
}

// Logout แค่ลบ cookie ฝั่ง browser — token เดิมยังใช้ได้จนหมดอายุเพราะไม่มี state ฝั่ง server
func (m *Manager) Logout(c fiber.Ctx) {
	ck := m.cookie("", time.Unix(0, 0))
	ck.MaxAge = -1
	c.Cookie(ck)
}

// Require ตอบ 401 ถ้าไม่มี cookie หรือ token ไม่ถูกต้อง ไม่งั้นเก็บ userID ไว้ให้ UserID อ่าน
func (m *Manager) Require() fiber.Handler {
	return func(c fiber.Ctx) error {
		userID, err := m.verify(c.Cookies(CookieName))
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
		}
		c.Locals(userIDKey{}, userID)
		return c.Next()
	}
}

// UserID คืน userID ของคนที่ login อยู่ ใช้ได้เฉพาะ route ที่ผ่าน Require แล้ว
func UserID(c fiber.Ctx) string {
	id, _ := c.Locals(userIDKey{}).(string)
	return id
}

func (m *Manager) verify(token string) (string, error) {
	var claims jwt.RegisteredClaims
	_, err := jwt.ParseWithClaims(token, &claims, func(*jwt.Token) (any, error) {
		return m.secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
	if err != nil {
		return "", err
	}
	if claims.Subject == "" {
		return "", errors.New("token has no subject")
	}
	return claims.Subject, nil
}

func (m *Manager) cookie(value string, expires time.Time) *fiber.Cookie {
	return &fiber.Cookie{
		Name:     CookieName,
		Value:    value,
		Path:     "/",
		Expires:  expires,
		HTTPOnly: true,
		Secure:   m.secureCookie,
		SameSite: fiber.CookieSameSiteLaxMode,
	}
}
