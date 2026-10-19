// Package user ดูแลบัญชีผู้ใช้และ profile
package user

import (
	"errors"
	"time"
)

var ErrNotFound = errors.New("user not found")

type User struct {
	ID          string
	DisplayName string
	Email       string
	CreatedAt   time.Time
}
