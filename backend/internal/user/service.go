package user

import "context"

type Repository interface {
	FindByID(ctx context.Context, id string) (User, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	return s.repo.FindByID(ctx, id)
}
