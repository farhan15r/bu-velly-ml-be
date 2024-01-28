## DOCUMENTATION

### Endpoints table

| Method | Endpoint                          | Description                                                                                         |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET    | [/](#get)                         | check model machine learning is loaded                                                              |
| GET    | [/load-model](#get-load-model)    | trigger server to load model machine learning model (this is automatically done when server starts) |
|        |                                   |                                                                                                     |
| POST   | [/predict](#post-predict)         | run prediction with .tif image                                                                      |
| GET    | [/predict](#get-predict)          | get all predictions                                                                                 |
| GET    | [/predict/:id](#get-predictid)    | get prediction by id                                                                                |
| DELETE | [/predict/:id](#delete-predictid) | delete prediction by id                                                                             |
|        |                                   |                                                                                                     |
| POST   | [/users](#post-users)             | register new user                                                                                   |
|        |                                   |                                                                                                     |
| POST   | [/auth](#post-auth)               | login user                                                                                          |

### Endpoints examples

---

#### GET /

##### Response

```json
{
  "modelIsLoaded": true
}
```

---

#### GET /load-model

##### Query params

- modelUrl=http://localhost:5000/public/model-ml/model.json

##### Response

```json
{
  "modelIsLoaded": true
}
```

---

#### POST /predict

##### Headers

- Authorization: Bearer {access token}
- Content-Type: multipart/form-data

##### Request body

form-data

- image: {.tif image}

##### Response

```json
{
  "uploaded_image": "/public/upload/1706422142.png",
  "result_image": "/public/result/1706422142.png"
}
```

---

#### GET /predict

##### Response

```json
[
  {
    "id": 1,
    "uploaded_image": "/public/upload/1706422142.png",
    "result_image": "/public/result/1706422142.png",
    "createdAt": "2021-03-01T17:06:42.000Z",
    "updatedAt": "2021-03-01T17:06:42.000Z"
  },
  {
    "id": 2,
    "uploaded_image": "/public/upload/1706422142.png",
    "result_image": "/public/result/1706422142.png",
    "createdAt": "2021-03-01T17:06:42.000Z",
    "updatedAt": "2021-03-01T17:06:42.000Z"
  }
]
```

---

#### GET /predict/:id

##### Response

```json
{
  "id": 1,
  "uploaded_image": "/public/upload/1706422142.png",
  "result_image": "/public/result/1706422142.png",
  "createdAt": "2021-03-01T17:06:42.000Z",
  "updatedAt": "2021-03-01T17:06:42.000Z"
}
```

---

#### DELETE /predict/:id

##### headers

- Authorization: Bearer {access token}

##### Response

```json
{
  "message": "Prediction deleted"
}
```

---

#### POST /users

##### Request body

```json
{
  "username": "otong123",
  "password": "password-otong123"
}
```

##### Response

```json
{
  "status": "success",
  "message": "User created"
}
```

---

#### POST /auth

##### Request body

```json
{
  "username": "otong123",
  "password": "password-otong123"
}
```

##### Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im90b25nMTIzIiwiaWF0IjoxNzA2NDIzMTA3LCJleHAiOjE3MDY0MjMxOTN9.qnytDY6l-8_Pq9SEhlmqHG6C9skX8pacdWbI8zidbbc"
}
```

---
