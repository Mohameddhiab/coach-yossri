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

  it("login admin + accès /users", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "yosricoach@gmail.com", password: "admin1234" })
      .expect(201);
    expect(res.body.user.role).toBe("COACH");
    expect(res.body.access_token).toBeDefined();

    const list = await request(app.getHttpServer())
      .get("/api/users?status=TOUS")
      .set("Authorization", `Bearer ${res.body.access_token}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it("login invalide → INVALID_CREDENTIALS", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "yosricoach@gmail.com", password: "wrong" })
      .expect(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("email inexistant → INVALID_CREDENTIALS", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "123456" })
      .expect(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
});
