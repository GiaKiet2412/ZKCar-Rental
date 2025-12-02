import { parseISO, format as dfFormat, isValid } from "date-fns";

/**
 * pickupFull / returnFull expected format: "yyyy-MM-dd HH:00" or "yyyy-MM-dd HH:mm" or Date object
 * Returns: "HH:mm, dd/MM/yyyy đến HH:mm, dd/MM/yyyy" by default (slash=true)
 * If slash=false -> uses dd-MM-yyyy
 */
export function formatBookingRange(pickupFull, returnFull, { slash = true } = {}) {
  if (!pickupFull || !returnFull) return "";

  // Normalize to ISO-like or Date object safely
  const normalize = (s) => {
    if (!s) return null;

    // ✅ Nếu đã là Date object
    if (s instanceof Date) return s;

    // ✅ Nếu không phải string thì bỏ qua
    if (typeof s !== "string") return null;

    let str = s.trim();
    if (!str.includes("T")) {
      // đảm bảo có phút, ví dụ: "HH:00"
      const parts = str.split(" ");
      if (parts.length === 2) {
        const timePart = parts[1];
        if (/^\d{2}$/.test(timePart)) {
          str = `${parts[0]} ${timePart}:00`;
        }
      }
      str = str.replace(" ", "T");
    }

    // thêm giây nếu thiếu
    if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(str)) str += ":00:00";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) str += ":00";

    const parsed = parseISO(str);
    return isValid(parsed) ? parsed : null;
  };

  const p = normalize(pickupFull);
  const r = normalize(returnFull);

  if (!p || !r) return `${pickupFull} → ${returnFull}`;

  const dateFmt = slash ? "dd/MM/yyyy" : "dd-MM-yyyy";
  const timeFmt = "HH:mm";

  return `${dfFormat(p, timeFmt)}, ${dfFormat(p, dateFmt)} đến ${dfFormat(r, timeFmt)}, ${dfFormat(r, dateFmt)}`;
}

/**
 * Format currency to Vietnamese style.
 * amount: number
 * short: if true uses "Đ" otherwise "VNĐ"
 */
export function formatCurrencyVN(amount, short = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return "";
  const formatted = Number(amount).toLocaleString("vi-VN");
  return `${formatted} ${short ? "Đ" : "VNĐ"}`;
}