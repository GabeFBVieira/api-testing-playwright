import { test, expect } from "@playwright/test";

let authToken: string;
let id: number;
test("GET /api/livros Busca livro pelo id 1 e verifica pelo titulo e disponibilidade", async ({
  request,
}) => {
  const response = await request.get(`http://localhost:3000/api/livros/${1}`);
  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(body.titulo).toBe("Dom Casmurro");
  expect(body.disponivel).toBe(true);
});

test.describe("Logar e fazer post com um livro", () => {
  test.beforeAll(async ({ request }) => {
    const login = await request.post("http://localhost:3000/api/auth/login", {
      data: { email: "admin@biblioteca.com", senha: "Admin@123" },
    });
    expect(login.status()).toBe(200);
    const resposta = await login.json();
    authToken = resposta.token;
  });
  test("POST /api/livros Validar a criação de um livro", async ({
    request,
  }) => {
    const payload = {
      titulo: "O Alienista",
      autor: "Machado de Assis",
      isbn: "9788500000097",
      anoPublicacao: 1882,
      quantidade: 2,
    };
    const response = await request.post("http://localhost:3000/api/livros", {
      headers: { Authorization: `Bearer ${authToken}` },
      data: payload,
    });
    const body = await response.json();

    id = body.id;
    expect(response.status()).toBe(201);
    expect(body).toMatchObject(payload);
    expect(body.id).toBeDefined();
  });
  test(" DELETE /api/livros/ Validar se a API deleta o livro anteriormente enviado", async ({
    request,
  }) => {
    const response = await request.delete(
      `http://localhost:3000/api/livros/${id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    expect(response.status()).toBe(204);
  });

  test("POST /api/livros Validar a recusa da API em aceita livros sem o envio do token", async ({
    request,
  }) => {
    const response = await request.post("http://localhost:3000/api/livros", {
      data: {
        titulo: "Blade Runner",
        autor: "Philip K.Dick",
        isbn: "114712874112",
        anoPublicacao: 1950,
        quantidade: 1,
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.erro).toBe("Token não informado");
  });
  test("POST /api/emprestimos Validar se a API nega o empréstimo de um livro indisponível", async ({
    request,
  }) => {
    const response = await request.post(
      `http://localhost:3000/api/emprestimos/`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { livroId: 4 },
      },
    );
    const body = await response.json();

    expect(response.status()).toBe(409);
    expect(body.erro).toBe("Livro indisponível");
  });
});
