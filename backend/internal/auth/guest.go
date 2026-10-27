package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v3"
)

// GuestCookieName คือ token ประจำเครื่องของ Guest (คนที่เข้าทริปโดยไม่มีบัญชี)
// เครื่องเดียวใช้ token เดียวกับทุกทริป — ล้าง cookie = เครื่องนี้ไม่ถูกจำแล้ว
const GuestCookieName = "guest_token"

const (
	guestTokenTTL = 365 * 24 * time.Hour
	guestTokenLen = 43 // 32 byte ใน base64url ไม่มี padding
)

// GuestToken คืน guest token จาก cookie หรือ "" ถ้าไม่มี/รูปแบบไม่ถูก
func GuestToken(c fiber.Ctx) string {
	if t := c.Cookies(GuestCookieName); len(t) == guestTokenLen {
		return t
	}
	return ""
}

// NewGuestToken สุ่ม token ใหม่ 32 byte (base64url 43 ตัว)
func NewGuestToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// SetGuestToken ตั้ง cookie อายุ 1 ปีให้เครื่องนี้
func (m *Manager) SetGuestToken(c fiber.Ctx, token string) {
	c.Cookie(&fiber.Cookie{
		Name:     GuestCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(guestTokenTTL),
		MaxAge:   int(guestTokenTTL.Seconds()),
		HTTPOnly: true,
		Secure:   m.secureCookie,
		SameSite: fiber.CookieSameSiteLaxMode,
	})
}

// HashGuestToken — DB เก็บแค่ hash ข้อมูลหลุดก็เอาไปสวมรอยเป็น Guest ไม่ได้
func HashGuestToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
