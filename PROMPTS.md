# PROMPTS.md — AI Interview Log (Edited Reconstruction)

> **Transparency note:** This is an edited reconstruction of the interview, not a verbatim raw chat export. Some user turns have been shortened or rephrased for readability based on the conversation. If the assessment requires raw, unedited AI logs, preserve and submit the original chat export or a public conversation link separately.

**Me:** A. Atomic purchase; exactly one succeeds, the other gets `409 Conflict`. Should the error body say “someone else just bought it” so the frontend can show a proper message?

**AI:** Yes. The status code communicates that the request conflicts with the current resource state; the response body should explain what happened. For example:

```json
{
  "error": {
    "code": "VEHICLE_UNAVAILABLE",
    "message": "This vehicle is no longer available."
  }
}
```

Use an atomic conditional update, such as decrementing stock only when `quantity > 0`. If no row is updated, check whether the vehicle still exists: return `404` if it does not, otherwise `409`. You do not need to identify the other buyer.

**Me:** A — `409`. What about `Alex@` vs `alex@`? Should I worry about two registrations racing, or is a unique constraint enough?

**AI:** Normalize email addresses consistently before storing and comparing them—for this project, trim surrounding whitespace and lowercase the email. Enforce uniqueness in the database as well as checking for duplicates in application code. The database constraint is essential for concurrent registrations; catch its uniqueness violation and return the same structured `409 Conflict` response instead of leaking a database error.

**Me:** A. Seed script, and public registration can't set role — otherwise anyone can make themselves admin.

**AI:** That is the safer approach. Use a documented Prisma seed script, `prisma/seed.ts`, to create the initial admin and sample vehicles. Public registration should always create a regular user and ignore any client-supplied `role`. Keep seed credentials development-only and document the setup in the README.

**Me:** wouldnt it be better to show possible vehicles even if id is wrong? from any other context clues? and maybe show the vehicle and say it is out of stock?

**AI:** These are two different cases. If the ID identifies a real vehicle with quantity zero, return `409 Conflict` and a useful message; the UI can keep the vehicle card visible and label it “Out of stock.” If the ID does not identify a vehicle, return `404 Not Found` rather than guessing what the user meant. The frontend can offer a link to browse or search inventory, and may show similar vehicles separately. It should not silently substitute another vehicle into the purchase request.

**Me:** B. Only admins can add, update, delete, and restock; authenticated regular users can browse, search, and purchase.

**AI:** That gives the system a clear role boundary. Require authentication for vehicle listing and search, allow authenticated users to purchase, and restrict all inventory-management operations to admins. Return `401` for missing, invalid, or expired authentication and `403` when an authenticated regular user attempts an admin-only operation.

**Me:** A. One unit per click, no quantity param. `400` if the body is malformed.

**AI:** That matches the stated purchase requirement and avoids unnecessary complexity. The endpoint should purchase exactly one unit, validate any request body it accepts, and perform the stock decrement atomically. Never trust a client-supplied quantity or allow stock to become negative.

**Me:** A. Return `400` with a clear validation message for malformed, negative, or conflicting price filters.

**AI:** Good. Treat non-numeric and negative prices, and `minPrice > maxPrice`, as invalid input and return `400 Bad Request` with the standard error envelope. Keep this distinct from a valid search that simply returns no matching vehicles. Since the API uses `priceCents`, document that `minPrice` and `maxPrice` are integer cents too.

**Me:** Option A for stale vehicle data: use the latest database state. If it was deleted, return `404`; if it is out of stock, return `409`. If the price changed, the purchase proceeds at the current price.

**AI:** The database should be authoritative, not the stale vehicle data in the browser. If the vehicle has been deleted, return `404 Not Found`; if it exists but stock is zero, return `409 Conflict`. If the price changed, proceed using the current database price and return the current purchase/vehicle result so the frontend can communicate it clearly. Because the user may have seen an old price, make the current-price behavior explicit in the UI.
