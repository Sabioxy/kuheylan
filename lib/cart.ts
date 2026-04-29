export const CART_KEY = "kuheylan:cart";
export const CART_EVENT = "kuheylan:cart:changed";

export const EMPTY_CART: string[] = [];
let cachedCartRaw: string | null = null;
let cachedCart: string[] = EMPTY_CART;

export function readCart(): string[] {
  if (typeof window === "undefined") return EMPTY_CART;

  let raw: string | null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    return cachedCart;
  }

  if (raw === cachedCartRaw) return cachedCart;
  cachedCartRaw = raw;

  if (!raw) {
    cachedCart = EMPTY_CART;
    return cachedCart;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedCart = EMPTY_CART;
      return cachedCart;
    }

    cachedCart = parsed.filter((x): x is string => typeof x === "string");
    return cachedCart;
  } catch {
    cachedCart = EMPTY_CART;
    return cachedCart;
  }
}

export function writeCart(ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.stringify(ids);
    localStorage.setItem(CART_KEY, raw);

    cachedCartRaw = raw;
    cachedCart = ids;

    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeCart(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_KEY) onStoreChange();
  };

  const onCustom: EventListener = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CART_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CART_EVENT, onCustom);
  };
}

export function addToCart(trackId: string) {
  const current = readCart();
  if (!current.includes(trackId)) {
    writeCart([...current, trackId]);
  }
}

export function removeFromCart(trackId: string) {
  const current = readCart();
  writeCart(current.filter((id) => id !== trackId));
}

export function clearCart() {
  writeCart([]);
}
