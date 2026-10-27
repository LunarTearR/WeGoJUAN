package user

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"time"
)

type Repository interface {
	FindByID(ctx context.Context, id uuid.UUID) (User, error)
	FindByEmail(ctx context.Context, email string) (User, error)
	CreateUser(ctx context.Context, user User) error
	UpdateDisplayName(ctx context.Context, id uuid.UUID, displayName string, updatedAt time.Time) (User, error)
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, updatedAt time.Time) error
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return User{}, ErrNotFound
	}
	return s.repo.FindByID(ctx, uid)
}

func (s *Service) Register(ctx context.Context, user User) error {

	existingUser, err := s.repo.FindByEmail(ctx, user.Email)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return err
	}
	if existingUser.Email != "" {
		return ErrEmailAlreadyExists
	}

	hashPassword, err := hashPassword(user.Password)
	if err != nil {
		return err
	}

	userInsert := User{
		ID:          uuid.New(),
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Password:    hashPassword,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = s.repo.CreateUser(ctx, userInsert)
	if err != nil {
		return err
	}

	return nil
}

// Login คืน ErrInvalidCredentials ทั้งกรณีไม่เจอ email และ password ผิด เพื่อไม่บอกว่า email ไหนมีในระบบ
func (s *Service) Login(ctx context.Context, email, password string) (User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if errors.Is(err, ErrNotFound) {
		return User{}, ErrInvalidCredentials
	}
	if err != nil {
		return User{}, err
	}
	if !checkPassword(user.Password, password) {
		return User{}, ErrInvalidCredentials
	}
	return user, nil
}

func (s *Service) UpdateDisplayName(ctx context.Context, id string, displayName string) (User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return User{}, ErrNotFound
	}
	return s.repo.UpdateDisplayName(ctx, uid, displayName, time.Now())
}

func (s *Service) ChangePassword(ctx context.Context, id string, currentPassword, newPassword string) error {
	user, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if !checkPassword(user.Password, currentPassword) {
		return ErrWrongPassword
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}
	return s.repo.UpdatePassword(ctx, user.ID, hash, time.Now())
}
