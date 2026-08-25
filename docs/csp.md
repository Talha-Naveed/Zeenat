# Content Security Policy

Zeenat.js v0.2 works without `unsafe-eval`, generated `<style>` elements, remote
assets, data URLs, or inline script. Effects create DOM/SVG nodes, set element style
properties, and use the Web Animations API.

The browser suite enforces this representative policy:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self';
connect-src 'self' ws:;
font-src 'self';
object-src 'none';
base-uri 'none'
```

No nonce API exists because Zeenat does not inject a style or script element that
could consume a nonce. A host framework's development tooling may require a looser
policy than its production build; that is separate from the library runtime.

Custom effects inherit this guarantee only when they avoid injected stylesheets,
inline script, `eval`, data URLs, and remote assets. Prefer element style properties,
SVG attributes, and registered Web Animations. If a future shared stylesheet becomes
necessary, nonce/hash support must be designed and tested before it ships.
