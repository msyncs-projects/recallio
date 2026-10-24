import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL starting with http:// or https:// is required' }, { status: 400 });
    }

    // SSRF Protection: Parse & block loopback, cloud metadata, and RFC 1918 private subnets
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Malformed URL' }, { status: 400 });
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.internal') ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.16.') ||
      host.startsWith('172.17.') ||
      host.startsWith('172.18.') ||
      host.startsWith('172.19.') ||
      host.startsWith('172.20.') ||
      host.startsWith('172.21.') ||
      host.startsWith('172.22.') ||
      host.startsWith('172.23.') ||
      host.startsWith('172.24.') ||
      host.startsWith('172.25.') ||
      host.startsWith('172.26.') ||
      host.startsWith('172.27.') ||
      host.startsWith('172.28.') ||
      host.startsWith('172.29.') ||
      host.startsWith('172.30.') ||
      host.startsWith('172.31.')
    ) {
      return NextResponse.json({ error: 'Requests to internal or private addresses are prohibited.' }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website (${response.status} ${response.statusText})` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    title = title.replace(/\s*[|\-–—].*$/, '').trim(); // Remove suffix like "| Wikipedia"
    if (!title) {
      try {
        const u = new URL(url);
        title = u.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || u.hostname;
      } catch {
        title = 'Web Article';
      }
    }

    // Clean body text and extract paragraphs/headings
    // Remove scripts, styles, svg
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Extract headings and paragraphs
    const paragraphs: string[] = [];
    const pRegex = /<(?:p|h[1-4]|li)[^>]*>([\s\S]*?)<\/(?:p|h[1-4]|li)>/gi;
    let match;

    while ((match = pRegex.exec(cleaned)) !== null && paragraphs.length < 25) {
      const raw = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      if (raw.length > 35 && !raw.includes('cookie') && !raw.includes('subscribe')) {
        paragraphs.push(raw);
      }
    }

    return NextResponse.json({
      success: true,
      title,
      url,
      paragraphs: paragraphs.slice(0, 15),
    });
  } catch (err: unknown) {
    console.error('Web import error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Web import failed' },
      { status: 500 }
    );
  }
}
