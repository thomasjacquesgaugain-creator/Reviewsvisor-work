/**
 * Tests pour sortEstablishmentsWithActiveFirst
 */

import { describe, it, expect } from "vitest";
import { sortEstablishmentsWithActiveFirst } from "./sortEstablishmentsWithActiveFirst";

type Est = { place_id: string; name: string; is_active?: boolean | null };

describe("sortEstablishmentsWithActiveFirst", () => {
  it("ne mute pas le tableau original", () => {
    const list: Est[] = [
      { place_id: "a", name: "A" },
      { place_id: "b", name: "B" },
    ];
    const copy = [...list];
    sortEstablishmentsWithActiveFirst(list, "b");
    expect(list).toEqual(copy);
  });

  it("met l'établissement actif (activeId) en premier", () => {
    const list: Est[] = [
      { place_id: "a", name: "A" },
      { place_id: "b", name: "B" },
      { place_id: "c", name: "C" },
    ];
    const sorted = sortEstablishmentsWithActiveFirst(list, "c");
    expect(sorted.map((e) => e.place_id)).toEqual(["c", "a", "b"]);
  });

  it("sans activeId, met les is_active true en premier (fallback)", () => {
    const list: Est[] = [
      { place_id: "a", name: "A", is_active: false },
      { place_id: "b", name: "B", is_active: true },
      { place_id: "c", name: "C", is_active: false },
    ];
    const sorted = sortEstablishmentsWithActiveFirst(list);
    expect(sorted.map((e) => e.place_id)).toEqual(["b", "a", "c"]);
  });

  it("activeId prime sur is_active si plusieurs actifs", () => {
    const list: Est[] = [
      { place_id: "a", name: "A", is_active: true },
      { place_id: "b", name: "B", is_active: true },
      { place_id: "c", name: "C", is_active: false },
    ];
    const sorted = sortEstablishmentsWithActiveFirst(list, "b");
    expect(sorted.map((e) => e.place_id)).toEqual(["b", "a", "c"]);
  });

  it("conserve l'ordre initial entre éléments de même priorité (tri stable)", () => {
    const list: Est[] = [
      { place_id: "x", name: "X" },
      { place_id: "y", name: "Y" },
    ];
    const sorted = sortEstablishmentsWithActiveFirst(list, "y");
    expect(sorted.map((e) => e.place_id)).toEqual(["y", "x"]);
  });

  it("retourne une copie si 0 ou 1 élément", () => {
    const empty: Est[] = [];
    expect(sortEstablishmentsWithActiveFirst(empty, "a")).toEqual([]);
    expect(sortEstablishmentsWithActiveFirst(empty)).not.toBe(empty);

    const one: Est[] = [{ place_id: "a", name: "A" }];
    expect(sortEstablishmentsWithActiveFirst(one, "a")).toEqual(one);
    expect(sortEstablishmentsWithActiveFirst(one, "a")).not.toBe(one);
  });
});
