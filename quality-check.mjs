import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`PASS ${message}`);
  else {
    console.error(`FAIL ${message}`);
    failures += 1;
  }
}

const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let schema;
try {
  schema = JSON.parse(schemaMatch?.[1] || '');
} catch {
  schema = null;
}

check(html.includes('<meta name="robots" content="noindex,nofollow">'), 'unpublished duplicate is noindex');
check(html.includes('<link rel="canonical" href="https://www.lowpriceautoglassspecialist.com/">'), 'preview canonical points to the established business site');
check(schema?.telephone === '+18316333338', 'structured phone matches the published business number');
check(!schema?.aggregateRating, 'structured data does not invent a rating or review count');
check(!/Maria J\.|Robert K\.|Teresa M\.|5-Star Rated|most trusted|Guaranteed Best Price|nobody in the area can beat|same-day/i.test(html), 'unsupported testimonials and superiority claims are absent');
check(!html.includes('tel:+18616333338'), 'mistyped phone link is absent');
check(html.includes('id="quote-consent"') && html.includes('id="website"'), 'quote form requires consent and includes a honeypot');
check(html.includes("phone.replace(/\\D/g, '').length < 7") && html.includes("checkValidity()"), 'quote form validates contact fields before submission');
check(html.includes('https://formspree.io/security/'), 'quote form discloses the third-party form provider');
check(!/respond within a few hours|get back to you quickly|Expect a call or email within/i.test(html), 'quote flow does not promise an unverified response time');

const headers = vercel.headers?.[0]?.headers || [];
const headerNames = new Set(headers.map((header) => header.key));
for (const name of ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
  check(headerNames.has(name), `${name} is configured`);
}

if (failures) process.exit(1);
console.log('\nAll lead-safety checks passed.');
