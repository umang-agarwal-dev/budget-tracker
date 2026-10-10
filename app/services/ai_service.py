from google import genai
from google.genai import types

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "You are a friendly, practical budgeting coach for college students in India. "
    "Amounts are in rupees (₹). Give actionable suggestions on where to cut down "
    "and how to stop overspending: name specific categories and specific habits. "
    "Be kind, never preachy or shaming. Use ONLY numbers from the facts; never "
    "calculate or invent numbers. No investment advice. Plain text only, no markdown."
)


class AIUnavailableError(Exception):
    pass


def savings_advice(facts: dict) -> str:
    categories = "\n".join(
        f"  - {c['category']}: spent ₹{c['spent']}, "
        f"a 10% cut saves ₹{c['cut_10']}, a 20% cut saves ₹{c['cut_20']}"
        for c in facts["top_categories"]
    ) or "  - no expenses yet"
    over = "yes" if facts["overspending"] else "no"

    prompt = f"""Facts (already calculated):
- Monthly budget: ₹{facts['monthly_budget']}
- Spent so far: ₹{facts['spent_so_far']} in {facts['days_passed']} of {facts['days_in_month']} days
- At this pace, month-end spend: ₹{facts['projected_month_spend']} (over budget: {over})
- Projected leftover: ₹{facts['projected_leftover']}
- Goal: {facts['goal']}, needs ₹{facts['monthly_needed']} per month for {facts['months_left']} more months
- Extra money to free up each month to hit the goal: ₹{facts['shortfall']}
- Top spending categories this month:
{categories}

Task: give spending suggestions, not a verdict.
1. One short line on how the month is going.
2. Pick 2 or 3 categories to cut down. For each, say how much a cut would save (use only the 10% or 20% figures above) and give one practical, student-friendly habit change.
3. If the extra money to free up is more than 0, say which cuts together would cover it, or suggest a longer deadline.
If the extra money to free up is 0 and spending is not over budget, praise briefly and suggest one small optional tweak.
Keep it under 6 short lines."""

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT, temperature=0.4
            ),
        )
    except Exception as exc:
        raise AIUnavailableError from exc

    if not response.text:
        raise AIUnavailableError
    return response.text.strip()