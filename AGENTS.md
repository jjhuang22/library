# Artifact delivery workflow

When the user asks to create an artifact or supplies an Acquired transcript, create the standalone illustrated HTML companion in this repository. Follow README.md and docs/acquired-artifacts.md. Register it in content/library.json, build, test, and inspect desktop and mobile rendering. Commit and push the complete source and assets to the established remote branch, then deploy through the existing hosting workflow and verify the live URL. Do not substitute a ChatGPT Page or treat a local build as delivery. No additional delivery confirmation is needed for this established workflow unless a tool requires approval. Preserve the existing site's audience. Report any concrete blocker honestly.

Read repository and hosting configuration before choosing a destination. Prefer /workspace/library over the older /workspace/acquired checkout for the shared Library. User instructions can override this default.

Hosting is GitHub → Vercel: push the agreed changes to `main` at `https://github.com/jjhuang22/library`; the existing Vercel integration builds and deploys the site. Use `npm run build` and the `dist/` output. Do not use ChatGPT Sites or create another hosting project. Check the pushed commit's Vercel deployment status when available.

The live library represents episodes the owner has listened to. Save new Acquired companions with `"published": false` in `content/library.json` unless the owner confirms listening or explicitly requests that episode live. Commit and push queued source, but keep it excluded from deployment output. Enable an episode individually when requested, preserving its original creation date. Never publish other queued episodes as part of an unrelated deployment.
