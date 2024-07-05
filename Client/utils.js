export function extractFieldFromPayload(payload, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, "i");
  const match = payload.match(regex);
  return match ? match[1].trim() : null;
}

export function extractFristLineFromPayload(payload) {
  const regex = new RegExp("^\\s*(.*)", "i");
  const match = payload.match(regex);
  return match ? match[1].trim() : null;
}
