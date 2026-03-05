# Translation Guidelines

Language-agnostic guidelines for writing and editing translations in this directory.

1. **Source of truth**: `en.json` defines all message keys. Every other `<lang>.json` must have exactly the same keys — no additions, no removals.
2. **Placeholders**: All `{variable}` tokens must be preserved exactly as in `en.json`. Never rename, reorder, or remove them.
3. **Tone**: Warm, direct, coach-like — not clinical or bureaucratic. Model after Garmin, Strava, and Komoot localization, not user manuals.
4. **Voice**: Active voice, direct address (informal "you" equivalent), short sentences. Prefer dashes over nested clauses.
5. **Technical terms**: Keep English sport/fitness terms that are standard in the target locale (TSS, FTP, VO2max, Threshold, Tempo). Don't force-translate established jargon.
6. **Labels vs descriptions**: Short UI labels stay terse. Longer descriptions and coaching text use conversational tone.
7. **Destructive actions**: Dialogs for delete/reset/clear stay clear and serious — no casual tone for irreversible operations.
8. **Analogies**: Metric explanations should sound like a knowledgeable friend, not a Wikipedia article. Use relatable comparisons.
9. **Compound nouns**: In languages prone to noun stacking (e.g. German), prefer verbal/prepositional rephrasing over long compound words.
