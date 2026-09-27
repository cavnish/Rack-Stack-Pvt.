/** Exercises the client-side rules the enquiry form relies on. */
import { isValidEmail, isValidPhone, validateInquiryFields, firstInvalidField } from "../src/lib/form-validation";

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`);
};

const good = {
  name: "Rohit Malhotra",
  company: "Malhotra Cold Storage",
  email: "rohit@malhotracoldstorage.in",
  phone: "+91 98200 41122",
  whatsapp: "9820041122",
  location: "Navi Mumbai",
  message: "Need racking for a new facility.",
};

console.log("\n-- valid payloads --");
check("complete valid form has no errors", validateInquiryFields(good), {});
check("optional fields may be blank", validateInquiryFields({ ...good, whatsapp: "", location: "" }), {});

console.log("\n-- email --");
for (const [value, expected] of [
  ["rohit@example.in", true],
  ["first.last@sub.domain.co.in", true],
  ["a@b.co", true],
  ["rohit@", false],
  ["@example.com", false],
  ["rohit.example.com", false],
  ["rohit @example.com", false],
  ["rohit@@example.com", false],
  ["", false],
] as [string, boolean][]) {
  check(`isValidEmail(${JSON.stringify(value)})`, isValidEmail(value), expected);
}

console.log("\n-- phone --");
for (const [value, expected] of [
  ["+91 98200 41122", true],
  ["9820041122", true],
  ["+91-98200-41122", true],
  ["(022) 1234 5678", true],
  ["1234567", true],
  ["123456", false],
  ["abc", false],
  ["+91 98200 41122 99999 0000", false],
  ["", false],
] as [string, boolean][]) {
  check(`isValidPhone(${JSON.stringify(value)})`, isValidPhone(value), expected);
}

console.log("\n-- required fields --");
for (const field of ["name", "company", "email", "phone", "message"] as const) {
  const errors = validateInquiryFields({ ...good, [field]: "   " });
  check(`blank ${field} is reported`, Object.keys(errors).includes(field), true);
}
check(
  "all missing at once reports all five",
  Object.keys(validateInquiryFields({ name: "", company: "", email: "", phone: "", whatsapp: "", location: "", message: "" })).sort(),
  ["company", "email", "message", "name", "phone"],
);
check("first invalid field follows DOM order", firstInvalidField(validateInquiryFields({ ...good, company: "", email: "bad" })), "company");
check("no errors yields null", firstInvalidField({}), null);
check("whatsapp is optional but validated when present", validateInquiryFields({ ...good, whatsapp: "123" }).whatsapp, "Please enter a valid WhatsApp number, or leave it blank.");

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exitCode = failures === 0 ? 0 : 1;
