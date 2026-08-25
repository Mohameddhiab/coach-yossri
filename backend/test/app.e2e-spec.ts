import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/shared/common/errors/global-exception.filter";

describe("API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("login coach + accès /users", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "coach@9awi.tn", password: "coach1234" })
      .expect(201);
    expect(res.body.user.role).toBe("COACH");
    expect(res.body.access_token).toBeDefined();

    const list = await request(app.getHttpServer())
      .get("/api/users?status=TOUS")
      .set("Authorization", `Bearer ${res.body.access_token}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(6);
  });

  it("login invalide → INVALID_CREDENTIALS", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "coach@9awi.tn", password: "wrong" })
      .expect(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("abonnement expiré → 403 SUBSCRIPTION_EXPIRED sur le plan", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "seif@demo.tn", password: "123456" })
      .expect(201);
    const res = await request(app.getHttpServer())
      .get("/api/users/me/plan")
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .expect(403);
    expect(res.body.code).toBe("SUBSCRIPTION_EXPIRED");
  });

  it("plan actif d'un membre (vue coach)", async () => {
    const coach = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "coach@9awi.tn", password: "coach1234" })
      .expect(201);
    const users = await request(app.getHttpServer())
      .get("/api/users?search=youssef")
      .set("Authorization", `Bearer ${coach.body.access_token}`)
      .expect(200);
    const plan = await request(app.getHttpServer())
      .get(`/api/users/${users.body[0].id}/plan`)
      .set("Authorization", `Bearer ${coach.body.access_token}`)
      .expect(200);
    expect(plan.body.meals.length).toBeGreaterThan(0);
    expect(plan.body.version).toBe(2);
  });

  it("leaderboard masqué pour un USER", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "youssef@demo.tn", password: "123456" })
      .expect(201);
    const lb = await request(app.getHttpServer())
      .get("/api/challenge/leaderboard")
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .expect(200);
    const row = lb.body.find((r: { pseudo: string }) => r.pseudo === "أنت");
    expect(row).toBeDefined();
  });

  it("POST poids avec valeur invalide → VALIDATION", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "youssef@demo.tn", password: "123456" })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post("/api/users/me/weight-logs")
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .send({ poids_kg: 500, date: "2026-08-19T00:00:00.000Z" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION");
  });
});