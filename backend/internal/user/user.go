// Package user ดูแลบัญชีผู้ใช้และ profile
package user

import (
	"errors"
	"github.com/google/uuid"
	"time"
)

var ErrNotFound = errors.New("user not found")
var ErrEmailAlreadyExists = errors.New("email already exists")
var ErrInvalidCredentials = errors.New("invalid email or password")
var ErrWrongPassword = errors.New("current password is incorrect")

type User struct {
	ID          uuid.UUID
	DisplayName string
	Email       string
	Password    string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
