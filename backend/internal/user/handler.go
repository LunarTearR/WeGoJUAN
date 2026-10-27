package user

import (
	"errors"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"strings"

	"WeGoJUAN-backend/internal/auth"
)

type Handler struct {
	svc  *Service
	auth *auth.Manager
}

func NewHandler(svc *Service, auth *auth.Manager) *Handler {
	return &Handler{svc: svc, auth: auth}
}

func (h *Handler) RegisterRoutes(r fiber.Router) {
	requireAuth := h.auth.Require()

	r.Post("/register", h.register)
	r.Post("/login", h.login)
	r.Post("/logout", h.logout)

	r.Get("/me", requireAuth, h.me)
	r.Patch("/me", requireAuth, h.updateMe)
	r.Put("/me/password", requireAuth, h.changePassword)

	// ต้องอยู่หลัง /me ไม่งั้น /:id จะจับ "me" ไปก่อน
	r.Get("/:id", requireAuth, h.getByID)
}

// userResponse คือ profile สาธารณะที่คนอื่นเห็น
type userResponse struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
}

// meResponse คือ profile ของตัวเอง มี email เพิ่ม
type meResponse struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
	Email       string    `json:"email"`
}

func newMeResponse(u User) meResponse {
	return meResponse{ID: u.ID, DisplayName: u.DisplayName, Email: u.Email}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateMeRequest struct {
	DisplayName string `json:"display_name"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type RegisterRequest struct {
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

func (h *Handler) getByID(c fiber.Ctx) error {
	u, err := h.svc.GetByID(c, c.Params("id"))
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if err != nil {
		return err
	}
	return c.JSON(userResponse{ID: u.ID, DisplayName: u.DisplayName})
}

func (h *Handler) register(c fiber.Ctx) error {
	var req RegisterRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	switch {
	case req.DisplayName == "":
		return fiber.NewError(fiber.StatusBadRequest, "display name is required")
	case req.Email == "":
		return fiber.NewError(fiber.StatusBadRequest, "email is required")
	case req.Password == "":
		return fiber.NewError(fiber.StatusBadRequest, "password is required")
	}

	displayName := strings.TrimSpace(req.DisplayName)
	email := strings.ToLower(strings.TrimSpace(req.Email))

	switch {
	case !isValidPassword(req.Password):
		return fiber.NewError(fiber.StatusBadRequest, "password must have at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	case !isValidDisplayName(displayName):
		return fiber.NewError(fiber.StatusBadRequest, "display name must be at least 3 characters long and at most 50 characters long")
	case !isValidEmail(email):
		return fiber.NewError(fiber.StatusBadRequest, "invalid email format")
	}

	user := User{
		DisplayName: displayName,
		Email:       email,
		Password:    req.Password,
	}

	err := h.svc.Register(c, user)
	if errors.Is(err, ErrEmailAlreadyExists) {
		return fiber.NewError(fiber.StatusConflict, err.Error())
	}
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "User registered successfully"})
}

func (h *Handler) login(c fiber.Ctx) error {
	var req LoginRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email and password are required")
	}

	u, err := h.svc.Login(c, email, req.Password)
	if errors.Is(err, ErrInvalidCredentials) {
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}
	if err != nil {
		return err
	}

	if err := h.auth.Login(c, u.ID.String()); err != nil {
		return err
	}
	return c.JSON(newMeResponse(u))
}

func (h *Handler) logout(c fiber.Ctx) error {
	h.auth.Logout(c)
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) me(c fiber.Ctx) error {
	u, err := h.svc.GetByID(c, auth.UserID(c))
	if errors.Is(err, ErrNotFound) {
		// token ยังไม่หมดอายุแต่ user ถูกลบไปแล้ว
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	if err != nil {
		return err
	}
	return c.JSON(newMeResponse(u))
}

func (h *Handler) updateMe(c fiber.Ctx) error {
	var req UpdateMeRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	displayName := strings.TrimSpace(req.DisplayName)
	if !isValidDisplayName(displayName) {
		return fiber.NewError(fiber.StatusBadRequest, "display name must be at least 3 characters long and at most 50 characters long")
	}

	u, err := h.svc.UpdateDisplayName(c, auth.UserID(c), displayName)
	if errors.Is(err, ErrNotFound) {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	if err != nil {
		return err
	}
	return c.JSON(newMeResponse(u))
}

func (h *Handler) changePassword(c fiber.Ctx) error {
	var req ChangePasswordRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	switch {
	case req.CurrentPassword == "":
		return fiber.NewError(fiber.StatusBadRequest, "current password is required")
	case !isValidPassword(req.NewPassword):
		return fiber.NewError(fiber.StatusBadRequest, "password must have at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	}

	err := h.svc.ChangePassword(c, auth.UserID(c), req.CurrentPassword, req.NewPassword)
	switch {
	case errors.Is(err, ErrWrongPassword):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, ErrNotFound):
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	case err != nil:
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
