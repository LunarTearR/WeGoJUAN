package user

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type fakeRepo struct {
	findUser  User
	findErr   error
	createErr error
	created   []User

	findEmails         []string // email ที่ถูกส่งเข้า FindByEmail
	displayNameUpdates []string
	passwordUpdates    []string // hash ที่ถูกส่งเข้า UpdatePassword
}

func (r *fakeRepo) FindByID(ctx context.Context, id uuid.UUID) (User, error) {
	return r.findUser, r.findErr
}

func (r *fakeRepo) FindByEmail(ctx context.Context, email string) (User, error) {
	r.findEmails = append(r.findEmails, email)
	return r.findUser, r.findErr
}

func (r *fakeRepo) CreateUser(ctx context.Context, u User) error {
	r.created = append(r.created, u)
	return r.createErr
}

func (r *fakeRepo) UpdateDisplayName(ctx context.Context, id uuid.UUID, displayName string, updatedAt time.Time) (User, error) {
	if r.findErr != nil {
		return User{}, r.findErr
	}
	r.displayNameUpdates = append(r.displayNameUpdates, displayName)
	u := r.findUser
	u.DisplayName = displayName
	u.UpdatedAt = updatedAt
	return u, nil
}

func (r *fakeRepo) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, updatedAt time.Time) error {
	if r.findErr != nil {
		return r.findErr
	}
	r.passwordUpdates = append(r.passwordUpdates, passwordHash)
	return nil
}

// existingUser คืน user ที่มี password = "Secret#123" (bcrypt MinCost ให้ test เร็ว)
func existingUser(t *testing.T) User {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte("Secret#123"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	return User{
		ID:          uuid.MustParse("6f1c2c1e-0d5e-4a43-9a51-0c7d0f6f5b11"),
		DisplayName: "alice",
		Email:       "a@x.com",
		Password:    string(hash),
	}
}

func TestRegister_EmailAlreadyExists(t *testing.T) {
	repo := &fakeRepo{findUser: User{Email: "a@x.com"}}
	svc := NewService(repo)

	err := svc.Register(t.Context(), User{Email: "a@x.com", Password: "Secret#123"})

	if !errors.Is(err, ErrEmailAlreadyExists) {
		t.Fatalf("want ErrEmailAlreadyExists, got %v", err)
	}
	if len(repo.created) != 0 {
		t.Fatalf("CreateUser should not be called, got %d calls", len(repo.created))
	}
}

func TestIsValidPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{"valid", "Secret#123", true},
		{"empty", "", false},
		{"too short", "100", false},
		{"no uppercase", "abc123!123", false},
		{"no lowercase", "ABC123!123", false},
		{"no digit", "ABCABcas!", false},
		{"no special", "Secret1234", false},
		{"dash is not special", "Pass-word1", false},
		{"exactly 8 bytes", "Aa1!aaaa", true},
		{"7 bytes", "Aa1!aaa", false},
		{"exactly 32 bytes", "Aa1!" + strings.Repeat("a", 28), true},
		{"33 bytes", "Aa1!" + strings.Repeat("a", 29), false},
		// 14 characters but 34 bytes: limit counts bytes so bcrypt (max 72 bytes) never fails
		{"thai 34 bytes", "Aa1!" + strings.Repeat("ก", 10), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isValidPassword(tt.password); got != tt.want {
				t.Errorf("isValidPassword(%q) = %v, want %v", tt.password, got, tt.want)
			}
		})
	}
}

func TestRegister_IsValidEmail(t *testing.T) {
	repo := &fakeRepo{}
	svc := NewService(repo)

	err := svc.Register(t.Context(), User{DisplayName: "test", Email: "a", Password: "Secreat#123"})

	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}

}

func TestLogin_Success(t *testing.T) {
	u := existingUser(t)
	svc := NewService(&fakeRepo{findUser: u})

	got, err := svc.Login(t.Context(), "a@x.com", "Secret#123")

	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if got.ID != u.ID {
		t.Errorf("ID = %v, want %v", got.ID, u.ID)
	}
}

func TestLogin_InvalidCredentials(t *testing.T) {
	u := existingUser(t)
	tests := []struct {
		name     string
		repo     *fakeRepo
		password string
	}{
		{"unknown email", &fakeRepo{findErr: ErrNotFound}, "Secret#123"},
		{"wrong password", &fakeRepo{findUser: u}, "Wrong#123"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewService(tt.repo).Login(t.Context(), "a@x.com", tt.password)
			if !errors.Is(err, ErrInvalidCredentials) {
				t.Fatalf("want ErrInvalidCredentials, got %v", err)
			}
		})
	}
}

func TestGetByID_InvalidUUID_NotFound(t *testing.T) {
	svc := NewService(&fakeRepo{findUser: existingUser(t)})

	_, err := svc.GetByID(t.Context(), "not-a-uuid")

	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("want ErrNotFound, got %v", err)
	}
}

func TestUpdateDisplayName(t *testing.T) {
	u := existingUser(t)
	repo := &fakeRepo{findUser: u}
	svc := NewService(repo)

	got, err := svc.UpdateDisplayName(t.Context(), u.ID.String(), "bob")

	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if got.DisplayName != "bob" {
		t.Errorf("DisplayName = %q, want %q", got.DisplayName, "bob")
	}
	if len(repo.displayNameUpdates) != 1 || repo.displayNameUpdates[0] != "bob" {
		t.Errorf("repo updates = %v, want [bob]", repo.displayNameUpdates)
	}
}

func TestChangePassword_WrongCurrent(t *testing.T) {
	u := existingUser(t)
	repo := &fakeRepo{findUser: u}
	svc := NewService(repo)

	err := svc.ChangePassword(t.Context(), u.ID.String(), "Wrong#123", "NewSecret#456")

	if !errors.Is(err, ErrWrongPassword) {
		t.Fatalf("want ErrWrongPassword, got %v", err)
	}
	if len(repo.passwordUpdates) != 0 {
		t.Fatalf("UpdatePassword should not be called, got %d calls", len(repo.passwordUpdates))
	}
}

func TestChangePassword_StoresHashOfNewPassword(t *testing.T) {
	u := existingUser(t)
	repo := &fakeRepo{findUser: u}
	svc := NewService(repo)

	err := svc.ChangePassword(t.Context(), u.ID.String(), "Secret#123", "NewSecret#456")

	if err != nil {
		t.Fatalf("want no error, got %v", err)
	}
	if len(repo.passwordUpdates) != 1 {
		t.Fatalf("want 1 UpdatePassword call, got %d", len(repo.passwordUpdates))
	}
	stored := repo.passwordUpdates[0]
	if stored == "NewSecret#456" {
		t.Fatal("password stored in plaintext")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(stored), []byte("NewSecret#456")); err != nil {
		t.Errorf("stored hash does not match new password: %v", err)
	}
}
