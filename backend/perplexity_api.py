#Shared plumbing for the Perplexity Agent API.
#
#The Sonar /chat/completions endpoint retires on 2026-09-27, so every model call in
#this backend goes through /v1/agent instead. The mapping from the old request shape
#is: messages -> input (system turns lifted out into instructions), max_tokens ->
#max_output_tokens, and web search, which Sonar always did, becomes an explicit tool.

AGENT_API_URL = "https://api.perplexity.ai/v1/agent"

#Direct replacement for the old "sonar" model slug.
DEFAULT_MODEL = "perplexity/sonar"

WEB_SEARCH_TOOL = {"type": "web_search"}


def build_agent_payload(messages, max_output_tokens=None, response_format=None,
                        model=DEFAULT_MODEL, web_search=True):
    #Turns a Sonar-style message list into an Agent API request body.
    instructions = "\n\n".join(
        m["content"] for m in messages
        if m.get("role") == "system" and m.get("content")
    )
    payload = {
        "model": model,
        "input": [m for m in messages if m.get("role") != "system"],
    }
    if instructions:
        payload["instructions"] = instructions
    if max_output_tokens is not None:
        payload["max_output_tokens"] = max_output_tokens
    if response_format is not None:
        payload["response_format"] = response_format
    if web_search:
        payload["tools"] = [WEB_SEARCH_TOOL]
    return payload


def agent_output_text(response_json):
    #The answer normally arrives in the convenience field "output_text"; fall back to
    #walking the typed "output" array, which also carries search results and tool
    #calls, when that field is absent.
    if not isinstance(response_json, dict):
        return ""

    text = response_json.get("output_text")
    if text:
        return text

    parts = []
    for item in response_json.get("output") or []:
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for part in item.get("content") or []:
            if isinstance(part, dict) and part.get("type") == "output_text" and part.get("text"):
                parts.append(part["text"])
    return "".join(parts)


def agent_finish_reason(response_json):
    #The Agent API flags a cut-off answer with status "incomplete" rather than the
    #old finish_reason "length"; callers still reason in the old vocabulary.
    if isinstance(response_json, dict) and response_json.get("status") == "incomplete":
        return "length"
    return "stop"
