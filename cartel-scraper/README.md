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
npm run scrape:quick -- --file urls.txt                           # first 10 URLs
npm run scrape:dry -- --url "https://example.com/article"        # no files written
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
- `output/_run-summary.json` for full run status (not written in `--dry-run`)

## Optional flags

- `--model <id>` override default model
- `--outdir <dir>` output directory (default: `./output`)
- `--maxChars <n>` cap extracted text sent to LLM (default: `24000`)
- `--limit <n>` process only first N URLs
- `--dry-run` print extraction preview without writing output files

## Notes

- This tool is intentionally separate from website runtime/build.
- Current scraper mode is **URL-driven extraction** (not RSS crawling).
- Respect source terms of service when scraping.


## Why it can still be "fussy"

Even though this tool is fully standalone, GitHub merge conflicts can still happen when:

- two branches edit the same files (`cartel-scraper/README.md`, `cartel-scraper/package.json`)
- one branch removes old `scrape.js` docs while another branch edits those same lines

That is a **git history overlap issue**, not a runtime dependency on the Next.js app.

Runtime/build isolation remains true:

- root app build does not import this folder
- scraper has its own `package.json` + lockfile
- scraper runs only when you `cd cartel-scraper && npm run ...`
