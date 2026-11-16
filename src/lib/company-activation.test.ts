import { describe, test } from "node:test";
import { deepStrictEqual, rejects } from "node:assert/strict";
import { activateCompanyManually } from "./company-activation";

describe("ativação manual de cliente", () => {
  test("ativa a empresa selecionada sem solicitar suspensão", async () => {
    const calls: unknown[] = [];
    await activateCompanyManually("cliente-selecionado", async (options) => {
      calls.push(options);
    });
    deepStrictEqual(calls, [{ data: { companyId: "cliente-selecionado", suspend: false } }]);
  });

  test("propaga falhas para não informar uma ativação que não ocorreu", async () => {
    await rejects(activateCompanyManually("cliente-selecionado", async () => {
      throw new Error("Acesso negado");
    }), /Acesso negado/);
  });
});