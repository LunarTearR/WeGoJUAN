package user

import (
	"regexp"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func checkPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func isValidEmail(email string) bool {
	if len(email) < 3 || len(email) > 254 {
		return false
	}
	emailRegex := `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`
	if match, _ := regexp.MatchString(emailRegex, email); !match {
		return false
	}
	return true
}

func isValidPassword(password string) bool {
	if len(password) < 8 || len(password) > 32 {
		return false
	}
	if match, _ := regexp.MatchString(`[A-Z]`, password); !match {
		return false
	}
	if match, _ := regexp.MatchString(`[a-z]`, password); !match {
		return false
	}
	if match, _ := regexp.MatchString(`[0-9]`, password); !match {
		return false
	}
	if match, _ := regexp.MatchString(`[!@#\$%\^&\*]`, password); !match {
		return false
	}
	return true
}

func isValidDisplayName(displayName string) bool {
	if utf8.RuneCountInString(displayName) < 3 || utf8.RuneCountInString(displayName) > 50 {
		return false
	}
	return true
}
