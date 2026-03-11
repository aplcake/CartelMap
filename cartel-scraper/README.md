# cartel-scraper

Standalone scraper — lives completely outside the Next.js app.

This rebuild includes **two local variants**:

- Anthropic (`scrape-anthropic.mjs`) via `ANTHROPIC_API_KEY`
- OpenAI (`scrape-openai.mjs`) via `OPENAI_API_KEY`

## Setup (one-time)

```bash
cd cartel-scraper
npm install
cp .env.example .env
# set ANTHROPIC_API_KEY and/or OPENAI_API_KEY
```

## Run

```bash
npm run scrape -- --url "https://example.com/article"            # default (Anthropic)
npm run scrape:anthropic -- --url "https://example.com/article"
npm run scrape:openai -- --url "https://example.com/article"
```

Multiple URLs:

```bash
npm run scrape:anthropic -- --url "https://a.com" --url "https://b.com"
npm run scrape:openai -- --url "https://a.com" --url "https://b.com"
```

From file (`urls.txt`, one URL per line):

```bash
npm run scrape:anthropic -- --file urls.txt
npm run scrape:openai -- --file urls.txt
```

## Output

- `output/<slug>.json` per URL
- `output/_run-summary.json` for full run status

## Optional flags

- `--model <id>` override default model
- `--outdir <dir>` output directory (default: `./output`)
- `--maxChars <n>` cap extracted text sent to LLM (default: `24000`)

## Notes

- This tool is intentionally separate from website runtime/build.
- Respect source terms of service when scraping.
