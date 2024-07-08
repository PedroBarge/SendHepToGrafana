import HEPjs from "hep-js";

export function decodeHEPMessage(message) {
  const data = HEPjs.decapsulate(message);
  return { hep: data };
}
