/** An immutable singly-linked list. Every operation returns a new list. */
export type List<A> =
  | { readonly kind: "nil" }
  | { readonly kind: "cons"; readonly hd: A; readonly tl: List<A> };

export const nil: { readonly kind: "nil" } = { kind: "nil" };

export const cons = <A,>(hd: A, tl: List<A>): List<A> => ({ kind: "cons", hd, tl });

/** Builds a list from an array (right fold). */
export const fromArray = <A,>(arr: ReadonlyArray<A>): List<A> =>
  arr.reduceRight<List<A>>((acc, x) => cons(x, acc), nil);

/** Converts a list back into a new array. */
export const toArray = <A,>(L: List<A>): A[] => {
  const out: A[] = [];
  for (let cur = L; cur.kind === "cons"; cur = cur.tl) out.push(cur.hd);
  return out;
};

export const len = <A,>(L: List<A>): number => (L.kind === "nil" ? 0 : 1 + len(L.tl));

/** concat(L, R) = L ++ R */
export const concat = <A,>(L: List<A>, R: List<A>): List<A> =>
  L.kind === "nil" ? R : cons(L.hd, concat(L.tl, R));

export const map = <A, B>(f: (a: A) => B, L: List<A>): List<B> =>
  L.kind === "nil" ? nil : cons(f(L.hd), map(f, L.tl));

/** Returns true if `prefix` is a prefix of `L` (by ===). */
export const startsWith = <A,>(prefix: List<A>, L: List<A>): boolean =>
  prefix.kind === "nil" ||
  (L.kind === "cons" && L.hd === prefix.hd && startsWith(prefix.tl, L.tl));
