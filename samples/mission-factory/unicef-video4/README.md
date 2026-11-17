# UNICEF YouTube video missions (Mission Creator only)

**No direct app hardcoding or automatic publication.** This is a draft **Mission Factory** import example. The question is **not** registered in the live Mission Creator database until an authenticated teacher imports it.

## Import

1. Put `questions.json` at the **root** of a ZIP (no folder path inside).
2. Sign in to the **Mission Creator** UI on a build containing the video4 import feature.
3. Open **AI教材・YouTube動画を5問まとめて取り込む** and select the ZIP.
4. Confirm country, domain, video URL, correct answer, source URLs, and target levels.
5. Save as **draft**. Review and approve in the regular **Mission Creator** flow, then choose the slot/order and publish.

The import method processes 1–5 questions at a time, checks for exact prompt duplicates, stores only the video URL (not video bytes), and uses the authenticated saveQuestion API. It does **not** publish by itself.

## Mission quota

The target is **10 missions per country per domain**. A YouTube video4 entry represents **one** Mission Creator mission, not a new seventh domain or an additional permanent parallel mission list. Before approving/publishing, inspect the existing mission count and replace/reorder an existing mission if the ten slots are already filled. The importer does not automatically overwrite an existing mission.

The existing Mission Creator `video4` format currently contains **one four-choice question per published mission**. To make multiple consecutive questions count as a single mission, the Creator schema, public catalog, editor, and learner need a separate grouped-video-quiz feature. Do not bypass the Creator database to implement that.

## Source review

Example: "13歳のアイシャの1日～水を得るために～" (Japan Committee for UNICEF).
- Official video gallery: https://www.unicef.or.jp/children/station.html
- Official YouTube video: https://www.youtube.com/watch?v=PP0IvKmLfRY

Before publishing, confirm that the video and subtitles are still available, that the video permits embedding, and that quiz wording is faithful to the footage.
