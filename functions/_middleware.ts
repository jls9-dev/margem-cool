/**
 * One canonical hostname: www.margemcool.pt → margemcool.pt, 301.
 *
 * Why this lives in the repo rather than in a Cloudflare Redirect Rule:
 *
 * www.margemcool.pt did not resolve at all until 9 Aug 2026 — the other three
 * brand sites all handled it, this one had no record. Binding it as a Pages
 * custom domain makes Pages *serve* it, which trades a dead hostname for two
 * hostnames serving identical content: exactly the duplicate-content leak that
 * splits link equity. Leaving it unbound but proxied gives a 522, because
 * nothing accepts the hostname.
 *
 * So the hostname must be bound AND redirected. A zone Redirect Rule is the
 * usual tool, but neither ops API token can write rulesets, and — more to the
 * point — a rule in a dashboard has no diff, no review and no deploy gate. The
 * analytics outage in July came from exactly that: load-bearing configuration
 * living only in a dashboard, where it failed silently for a month. This is a
 * few lines of code that ships with the site instead.
 *
 * Path and query are preserved so existing inbound links land where they should.
 */
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.margemcool.pt') {
    url.hostname = 'margemcool.pt';
    // 301 rather than 302: this is permanent, and search engines should
    // consolidate any accumulated signal onto the apex.
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
