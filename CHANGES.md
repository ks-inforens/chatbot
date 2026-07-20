# Changelog

## Chatbot: content retrieval, link accuracy, and reliability fixes

### Retrieval & redirect accuracy
- Replaced the flat "first 8000 characters of the scraped site file" prompt content with real per-question retrieval: the scraped file is split into ~116 chunks (13 pages, with the oversized `/blogs` page further split into its ~104 individual posts), and each question is scored against all chunks (BM25) to select the most relevant ones for the prompt.
- Added link validation: any URL the model returns is checked against the known site URL list before being sent to the frontend. Unrecognized/invented URLs are dropped and replaced with a safe fallback link.
- Enforced the `{answer, links}` JSON response shape at the API level via a `response_format` JSON schema, instead of relying only on prompt instructions. This fixes cases (e.g. short/casual messages like "Hello") where the model would reply in free text and the app couldn't parse a response.
- Raised the response token limit to reduce truncation-related parsing failures.

### Reliability fixes
- Fixed a bug where an unhandled error path referenced an undefined variable, which hid the real error behind a crash.
- Added request timeouts to outbound AI API calls so a hung request can no longer block the server.
- Fixed the audio transcription endpoint to accept POST requests (previously only GET was allowed, mismatching what the frontend sends).
- The chatbot and its content index are now built once when the server starts, instead of being rebuilt from disk on every single request.
- Fixed a bug where all users without an explicit session id shared one conversation history bucket; each now gets its own.
- Query logging now records whether a request actually succeeded and why it failed when it didn't, and records the real model name used, instead of always marking requests as successful with a hardcoded model label.

### Cleanup
- Removed two unused, outdated prototype chatbot files.
- Consolidated duplicate/unused API key environment variables into one (`CHATBOT_API_KEY`).
- Added an example environment file listing all required configuration keys.

### Action needed
- The API key previously hardcoded in one of the removed prototype files was exposed in git history. It should be rotated in the provider dashboard, and the deployment's environment variables updated with the new key.
