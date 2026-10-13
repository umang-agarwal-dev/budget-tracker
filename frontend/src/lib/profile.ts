const KEY = "pocket:avatar";
export const getAvatar = () => (typeof window === "undefined" ? null : localStorage.getItem(KEY));
export const notify = () => window.dispatchEvent(new Event("pocket:profile"));
export function setAvatar(url: string | null) {
  if (url) localStorage.setItem(KEY, url); else localStorage.removeItem(KEY);
  notify();
}
// Crops the picture to a square and shrinks it, so it is small enough to keep on this device.
export function fileToAvatar(file: File): Promise<string> {
  return new Promise((ok, fail) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = 200, c = document.createElement("canvas");
      c.width = c.height = s;
      const m = Math.min(img.width, img.height);
      c.getContext("2d")?.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => fail(new Error("That file is not a valid image"));
    img.src = url;
  });
}
