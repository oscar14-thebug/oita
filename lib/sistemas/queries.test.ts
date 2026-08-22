import { describe, it, expect, vi, beforeEach } from "vitest";

const findManyMock = vi.fn();
const countMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sistema: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      count: (...args: unknown[]) => countMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

const { listSistemas, getSistemaDetalle } = await import("./queries");

describe("listSistemas", () => {
  beforeEach(() => {
    findManyMock.mockReset().mockResolvedValue([]);
    countMock.mockReset().mockResolvedValue(0);
    findUniqueMock.mockReset();
  });

  it("filtra por país a través de la relación institución", async () => {
    await listSistemas({ pais: "AR" });

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(countMock).toHaveBeenCalledTimes(1);

    const whereFindMany = findManyMock.mock.calls[0][0].where;
    const whereCount = countMock.mock.calls[0][0].where;

    expect(whereFindMany).toMatchObject({ institucion: { pais: "AR" } });
    expect(whereCount).toMatchObject({ institucion: { pais: "AR" } });
  });

  it("combina país y sector en el mismo filtro de institución", async () => {
    await listSistemas({ pais: "CL", sector: "salud" });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where).toMatchObject({ institucion: { pais: "CL", sector: "salud" } });
  });

  it("no agrega el filtro de institución si no se pasan pais/sector", async () => {
    await listSistemas({ texto: "reconocimiento" });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where.institucion).toBeUndefined();
    expect(where.nombreOficial).toMatchObject({ contains: "reconocimiento", mode: "insensitive" });
  });

  it("aplica límites de paginación por defecto y máximos", async () => {
    await listSistemas({ pais: "AR", limit: 500, offset: -5 });

    const args = findManyMock.mock.calls[0][0];
    expect(args.take).toBe(100);
    expect(args.skip).toBe(0);
  });
});

describe("getSistemaDetalle", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("devuelve null sin consultar la base cuando el id no tiene forma de uuid", async () => {
    const resultado = await getSistemaDetalle("id-que-no-existe");

    expect(resultado).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
