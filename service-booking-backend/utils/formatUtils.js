export function formatCurrencyVN(amount, short = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return "";
  const formatted = Number(amount).toLocaleString("vi-VN");
  return `${formatted} ${short ? "Đ" : "VNĐ"}`;
}