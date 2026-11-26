# Bilingual World Games / existing mission migration

- Canonical question IDs, source metadata, data year and correctIndex are shared across Japanese and English.
- Keep existing Japanese prompt, choices and explanation. Add translations.en = {prompt, choices, explanation, subcategory?}; preserve the same choice ordering and semantic answer.
- Localize the question BEFORE randomizing the choices. Never send answer keys to online players until reveal. No machine translation requests are necessary during a game.
- English mode filters incomplete translations rather than mixing Japanese and English. The setup shows the number excluded.
- All current standalone World Games capital/time templates use the bilingual contract. The other country-study modes, including the ten-mission geography/time packages and published Mission Creator records, require their own localization and UI migration. Do not mark them completed merely because they use the same country.
- For Mission Creator, preserve original published records and their question IDs. Stage English prompt, correct answer, three distractors and explanation in a separate reviewed translation record keyed by question ID (and source revision). Photo/video/JICA source-dependent items remain in country study, not random battle. English translations of questions about a JICA diary do not imply that the original diary has an English edition.
- For future AIA and World Bank data updates, create Japanese and English together, use the same verified value and data year, and independently review the linguistic and factual accuracy of both. Keep draft records excluded until content and rights review is complete.
- UI: Japanese teacher setup may stay Japanese; English quiz stems, choices, feedback, answer explanations and review contents must be English. Complete English navigation, accessibility labels, travel controls, and full country-study localization remain separate work.
