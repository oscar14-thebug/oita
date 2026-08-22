import { describe, it, expect, vi, beforeEach } from "vitest";

const indicadorFindManyMock = vi.fn();
const controlCalidadFindManyMock = vi.fn();
const puntuacionFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    indicador: { findMany: (...args: unknown[]) => indicadorFindManyMock(...args) },
    controlCalidad: { findMany: (...args: unknown[]) => controlCalidadFindManyMock(...args) },
    puntuacion: { findMany: (...args: unknown[]) => puntuacionFindManyMock(...args) },
  },
}));

const { calcularScoreITAD } = await import("./calcularScoreITAD");

// Dos indicadores en D1 (peso 6 y 4) y dos en D2 (peso 5 y 5) — total peso 20.
const INDICADORES = [
  { id: "I-1", pesoInterno: 6, dimensionId: "D1", dimension: { nombre: "D1" } },
  { id: "I-2", pesoInterno: 4, dimensionId: "D1", dimension: { nombre: "D1" } },
  { id: "I-3", pesoInterno: 5, dimensionId: "D2", dimension: { nombre: "D2" } },
  { id: "I-4", pesoInterno: 5, dimensionId: "D2", dimension: { nombre: "D2" } },
];

function puntuacion(indicadorId: string, opts: { esNoAplicable?: boolean; conFuente?: boolean }) {
  return {
    indicadorId,
    esNoAplicable: opts.esNoAplicable ?? false,
    fuentesPuntuaciones: opts.conFuente ? [{ id: "fp-1" }] : [],
  };
}

function controlCalidad(indicadorId: string, valorFinal: number) {
  return { indicadorId, valorFinal };
}

describe("calcularScoreITAD", () => {
  beforeEach(() => {
    indicadorFindManyMock.mockReset().mockResolvedValue(INDICADORES);
    controlCalidadFindManyMock.mockReset();
    puntuacionFindManyMock.mockReset();
  });

  it("calcula el score cuando todos los indicadores son aplicables", async () => {
    controlCalidadFindManyMock.mockResolvedValue([
      controlCalidad("I-1", 3),
      controlCalidad("I-2", 2),
      controlCalidad("I-3", 3),
      controlCalidad("I-4", 1),
    ]);
    puntuacionFindManyMock.mockResolvedValue([
      puntuacion("I-1", { conFuente: true }),
      puntuacion("I-2", { conFuente: true }),
      puntuacion("I-3", { conFuente: true }),
      puntuacion("I-4", { conFuente: false }),
    ]);

    const resultado = await calcularScoreITAD("sistema-1");

    expect(resultado.estado).toBe("evaluado");
    // suma ponderada = 6*3 + 4*2 + 5*3 + 5*1 = 18+8+15+5 = 46; peso total = 20
    // score = 100 * (46/20/3) = 76.67
    expect(resultado.scoreTotal).toBeCloseTo(76.67, 1);
    expect(resultado.scorePorDimension).toEqual({ D1: 2.6, D2: 2 });
    expect(resultado.distribucion).toEqual({ "0": 0, "1": 1, "2": 1, "3": 2, na: 0 });
    // cubierto (valor>=1 y con fuente): I-1(6)+I-2(4)+I-3(5) = 15 de 20 -> 75%
    expect(resultado.coberturaDocumental).toBeCloseTo(75, 1);
  });

  it("excluye del cálculo los indicadores marcados como N/A", async () => {
    controlCalidadFindManyMock.mockResolvedValue([
      controlCalidad("I-1", 3),
      controlCalidad("I-3", 2),
    ]);
    puntuacionFindManyMock.mockResolvedValue([
      puntuacion("I-1", { conFuente: true }),
      puntuacion("I-2", { esNoAplicable: true }),
      puntuacion("I-3", { conFuente: true }),
      puntuacion("I-4", { esNoAplicable: true }),
    ]);

    const resultado = await calcularScoreITAD("sistema-2");

    expect(resultado.estado).toBe("evaluado");
    // I-2 e I-4 son N/A: se excluyen de numerador y denominador.
    // suma ponderada = 6*3 + 5*2 = 28; peso aplicable = 6+5 = 11
    // score = 100 * (28/11/3) = 84.85
    expect(resultado.scoreTotal).toBeCloseTo(84.85, 1);
    expect(resultado.distribucion).toEqual({ "0": 0, "1": 0, "2": 1, "3": 1, na: 2 });
  });

  it("devuelve estado sin_evaluar (no lanza error) si el sistema no tiene puntuaciones", async () => {
    controlCalidadFindManyMock.mockResolvedValue([]);
    puntuacionFindManyMock.mockResolvedValue([]);

    const resultado = await calcularScoreITAD("sistema-sin-evaluar");

    expect(resultado.estado).toBe("sin_evaluar");
    expect(resultado.scoreTotal).toBeNull();
    expect(resultado.scorePorDimension).toBeNull();
    expect(resultado.coberturaDocumental).toBeNull();
  });
});
