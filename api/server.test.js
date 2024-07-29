const request = require('supertest');
const server = require('./server');
const db = require('../data/dbConfig');

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeEach(async () => {
  await db('users').truncate();
});

afterAll(async () => {
  await db.destroy();
});

test('sanity', () => {
  expect(true).toBe(true);
});

describe('auth endpoints', () => {
  describe('[POST] /api/auth/register', () => {
    it('responds with a 201 created status on successful registration', async () => {
      const res = await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      expect(res.status).toBe(201);
      expect(res.body.username).toBe('testuser');
    });

    it('responds with a 400 status if username or password is missing', async () => {
      const res = await request(server).post('/api/auth/register').send({
        username: 'testuser'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('username and password required');
    });

    it('responds with a 400 status if the username is taken', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('username taken');
    });
  });

  describe('[POST] /api/auth/login', () => {
    it('responds with a 200 status and a token on successful login', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123'
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('welcome, testuser');
      expect(res.body.token).toBeDefined();
    });

    it('responds with a 400 status if username or password is missing', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('username and password required');
    });

    it('responds with a 400 status if credentials are invalid', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('invalid credentials');
    });
  });
});

describe('jokes endpoints', () => {
  describe('[GET] /api/jokes', () => {
    it('responds with a 401 status if no token is provided', async () => {
      const res = await request(server).get('/api/jokes');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('token required');
    });

    it('responds with a 401 status if the token is invalid', async () => {
      const res = await request(server)
        .get('/api/jokes')
        .set('Authorization', 'invalidtoken');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('token invalid');
    });

    it('responds with a 200 status and jokes data if the token is valid', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123'
      });
      const loginRes = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(server)
        .get('/api/jokes')
        .set('Authorization', loginRes.body.token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3); // Assuming there are 3 jokes
    });
  });
});
