# Dummy request data (copy/paste)

Assumes the API is running on `http://localhost:3000`.

Tip (cookies): for endpoints protected by `AuthGuard`, use a cookie jar:
`-c cookies.txt` (save) and `-b cookies.txt` (send).

## User

### Create user (register)

```json
{
  "firstname": "Admin",
  "lastname": "User",
  "email": "admin@example.com",
  "password": "Admin@12345",
  "phone": "9800000000",
  "role": "ADMIN"
}
```

```bash
curl -sS -X POST http://localhost:3000/user/register \
  -H 'Content-Type: application/json' \
  -d '{"firstname":"Admin","lastname":"User","email":"admin@example.com","password":"Admin@12345","phone":"9800000000","role":"ADMIN"}'
```

### Login user (sets cookies)

```json
{ "email": "admin@example.com", "password": "Admin@12345" }
```

```bash
curl -sS -X POST http://localhost:3000/user/login \
  -c cookies.admin.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'
```

### Update user (ADMIN only)

`email` is the identifier; other fields are optional.

```json
{
  "email": "admin@example.com",
  "firstname": "AdminUpdated",
  "bio": "Admin account for testing",
  "phone": "9811111111"
}
```

```bash
curl -sS -X PATCH http://localhost:3000/user/update \
  -b cookies.admin.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","firstname":"AdminUpdated","bio":"Admin account for testing","phone":"9811111111"}'
```

### Get one user (ADMIN only)

```bash
curl -sS http://localhost:3000/user/1 -b cookies.admin.txt
```

### Get all users (ADMIN only)

```bash
curl -sS http://localhost:3000/user -b cookies.admin.txt
```

## Company (ADMIN only)

### Create company

```json
{ "name": "Acme Inc", "registrationId": "REG-001", "totalEmployee": 120 }
```

```bash
curl -sS -X POST http://localhost:3000/company/create \
  -b cookies.admin.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Inc","registrationId":"REG-001","totalEmployee":120}'
```

### Update company (path param is `registrationId`)

```json
{ "registrationId": "REG-001", "name": "Acme Inc (Updated)", "totalEmployee": 150 }
```

```bash
curl -sS -X PATCH http://localhost:3000/company/REG-001 \
  -b cookies.admin.txt \
  -H 'Content-Type: application/json' \
  -d '{"registrationId":"REG-001","name":"Acme Inc (Updated)","totalEmployee":150}'
```

### Get one company (path param is `registrationId`)

```bash
curl -sS http://localhost:3000/company/REG-001 -b cookies.admin.txt
```

### Get all companies

```bash
curl -sS http://localhost:3000/company -b cookies.admin.txt
```

### Delete company (path param is `registrationId`)

```bash
curl -sS -X DELETE http://localhost:3000/company/REG-001 -b cookies.admin.txt
```

## Job

### Create recruiter user (so you can create jobs)

Create a company first, then set `companyId` to the returned company `id`.

```json
{
  "firstname": "Recruiter",
  "lastname": "One",
  "email": "recruiter1@example.com",
  "password": "Recruiter@12345",
  "phone": "9800000001",
  "role": "RECRUITER",
  "companyId": 1
}
```

```bash
curl -sS -X POST http://localhost:3000/user/register \
  -H 'Content-Type: application/json' \
  -d '{"firstname":"Recruiter","lastname":"One","email":"recruiter1@example.com","password":"Recruiter@12345","phone":"9800000001","role":"RECRUITER","companyId":1}'
```

### Login recruiter (sets cookies)

```bash
curl -sS -X POST http://localhost:3000/user/login \
  -c cookies.recruiter1.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"recruiter1@example.com","password":"Recruiter@12345"}'
```

### Create job (ADMIN/RECRUITER only)

```json
{
  "title": "Backend Developer (Node/Nest)",
  "description": "Build APIs and services",
  "location": "Kathmandu",
  "salary": 120000,
  "jobType": "FULL_TIME",
  "isActive": true,
  "companyId": 1
}
```

```bash
curl -sS -X POST http://localhost:3000/job/create \
  -b cookies.recruiter1.txt \
  -H 'Content-Type: application/json' \
  -d '{"title":"Backend Developer (Node/Nest)","description":"Build APIs and services","location":"Kathmandu","salary":120000,"jobType":"FULL_TIME","isActive":true,"companyId":1}'
```

### Update job (ADMIN/RECRUITER only)

```json
{ "title": "Backend Developer (Updated)", "salary": 130000 }
```

```bash
curl -sS -X PATCH http://localhost:3000/job/1 \
  -b cookies.recruiter1.txt \
  -H 'Content-Type: application/json' \
  -d '{"title":"Backend Developer (Updated)","salary":130000}'
```

### Get one job (public)

```bash
curl -sS http://localhost:3000/job/1
```

### List jobs (public)

```bash
curl -sS "http://localhost:3000/job?page=1&limit=10&location=kathmandu&q=developer&sortBy=createdAt&sortOrder=desc"
```

### Delete job (ADMIN/RECRUITER only)

```bash
curl -sS -X DELETE http://localhost:3000/job/1 -b cookies.recruiter1.txt
```

