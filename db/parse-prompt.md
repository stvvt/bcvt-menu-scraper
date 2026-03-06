Parse a restaurant menu and output JSON in the following format:

```json
{
  "date": "DD.MM.YYYY",
  "meals": [
    {
      "name": "...",
      "weight": 000,
      "unit": "...",
      "subtitle": "...",
      "price": 0.00,
      "currency": "..."
    }
  ]
}

Rules:

* Prefer EUR prices
* Strip numbers in parentheses from meal names e.g. (1,3,7) or /1,3,7/ (those are allergens)
* Extract weight/quantity found usually near the end of meal name into a "weight" prop (numeric, e.g. 110, 400)
* Extract the unit of measurement into a unit prop (e.g. гр, мл)
* Extract any parenthesised or slash-enclosed descriptive text usually at the end of the meal name into a subtitle prop (e.g. домати, краставици, моцарела...)
* The name field must be clean — no weight, unit, allergen numbers, or subtitle text
* Omit any property that has no value — do not output null props
* Use гр for grams (not г)
* Apply sentence case to the name field — capitalize the first letter of the first word only, except for proper nouns which should retain their capitalization (e.g. place names, brand names, culinary proper nouns like Брюле or Филаделфия).
