# Task: Step 1.3 - Authentication System

## Plan

- [ ] Create auth DTOs (register, login, token responses)
- [ ] Implement password hashing service
- [ ] Create auth service with register/login logic
- [ ] Set up JWT strategy with Passport
- [ ] Create auth guards (JWT guard, public decorator)
- [ ] Implement auth controller with endpoints
- [ ] Create user profile endpoint (GET /me)
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test token refresh flow
- [ ] Test protected endpoint access

## Endpoints to Create

### Public Endpoints
- `POST /auth/register` - Register new user (email/password)
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token

### Protected Endpoints
- `GET /me` - Get current user profile
- `PATCH /me` - Update user profile

## Success Criteria

- ✅ Users can register with email/password
- ✅ Passwords are hashed with bcrypt
- ✅ Login returns access + refresh tokens
- ✅ JWT tokens are properly signed and validated
- ✅ Protected endpoints reject unauthorized requests
- ✅ Tokens can be refreshed
- ✅ Current user can be retrieved from token

## Notes

- Use bcrypt for password hashing (salt rounds: 10)
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- JWT strategy validates tokens on protected routes
- Keep it simple - email/password only (no social auth yet)
- Use class-validator for DTO validation
