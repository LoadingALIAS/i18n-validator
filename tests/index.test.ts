import { i18nValidator } from "../src";

console.log("Testing parseLocale:");
console.log(i18nValidator.parseLocale("english")); // { language: 'en' }
console.log(i18nValidator.parseLocale("en-NZ")); // { language: 'en', region: 'NZ' }
console.log(i18nValidator.parseLocale("fr")); // { language: 'fr' }
console.log(i18nValidator.parseLocale("invalid")); // null

console.log("Testing toBcp47:");
console.log(i18nValidator.toBcp47({ language: "en", region: "US" })); // 'en-US'
