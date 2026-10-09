import { describe, it, expect } from "vitest";
import { resolverValorFinalIndicador } from "./resolverValorFinalIndicador";

describe("resolverValorFinalIndicador", () => {
  it("usa el valorFinal adjudicado cuando hay control_calidad, aunque haya 2+ puntuaciones", () => {
    const resultado = resolverValorFinalIndicador(
      [{ valor: 1 }, { valor: 3 }],
      { valorFinal: 2 },
    );
    expect(resultado).toEqual({ estado: "adjudicado", valor: 2 });
  });

  it("usa el valor directo cuando hay exactamente un evaluador y no hay control_calidad", () => {
    const resultado = resolverValorFinalIndicador([{ valor: 1 }], undefined);
    expect(resultado).toEqual({ estado: "individual", valor: 1 });
  });

  it("marca pendiente de adjudicación con 2+ puntuaciones y sin control_calidad", () => {
    const resultado = resolverValorFinalIndicador([{ valor: 1 }, { valor: 3 }], undefined);
    expect(resultado).toEqual({ estado: "pendiente_adjudicacion", valor: null });
  });

  it("marca sin_evaluar cuando no hay ninguna puntuación", () => {
    const resultado = resolverValorFinalIndicador([], undefined);
    expect(resultado).toEqual({ estado: "sin_evaluar", valor: null });
  });

  it("marca sin_evaluar si la única puntuación tiene valor null (caso N/A no filtrado)", () => {
    const resultado = resolverValorFinalIndicador([{ valor: null }], undefined);
    expect(resultado).toEqual({ estado: "sin_evaluar", valor: null });
  });
});
