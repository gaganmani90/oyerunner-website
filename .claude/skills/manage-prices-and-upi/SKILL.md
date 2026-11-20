---
name: manage-prices-and-upi
description: Change paid plan or coaching prices, add or remove a paid option, or set/change the UPI ID for "Pay by UPI" on the Oye Runner website. Use for "price change karo", "add a 3-month package", "update my UPI ID", "turn off UPI payments".
---

# Prices and UPI payments

Prices: `content/pricing.yaml`. UPI ID: `content/site.yaml → payments`.

## Change a price

1. Edit `price:` of that item in `content/pricing.yaml`. **Numbers only**: `2499`, not `"2,499"` or `Rs. 2499`.
2. If a feature line mentions money (e.g. "Works out to Rs. 2,083 a month" under Annual coaching), recalculate it and tell the person you updated it.
3. Confirm the new price back to them before publishing: "Annual coaching: Rs. 24,999 → Rs. 21,999. Publish?"

The price card, the "Pay Rs. X by UPI" button, the UPI QR code and the amount in the payment link all update automatically.

## Add a paid option

Copy an existing item in `one_time.items` (one-time plan) or `subscriptions.items` (monthly/yearly), then change it:

```yaml
    - name: 3-month coaching
      price: 6999
      per: month            # only "month" or "year"; leave out for one-time plans
      tag: New              # optional gold label
      featured: false       # true = red card
      features:
        - First feature
        - Second feature
      request: Monthly coaching   # must match a line in content/home.yaml → start_form.requests
```

`request` must be one of the options in `content/home.yaml → start_form.requests`; add a new option there if needed.
Keep grids tidy: 4 cards in the one-time row and 3 in the subscription row look best.

## Remove a paid option

Delete its block. Confirm with the person first.

## Set or change the UPI ID

1. Ask for the exact UPI ID if they haven't given it (looks like `name@okhdfcbank`, `98xxxxxx@ybl`). Read it back to them before saving: a typo sends money to the wrong place.
2. Set `content/site.yaml → payments.upi_id: "their-id@bank"` and, if they want, `payee_name` (the name shown in the UPI app).
3. Run `npm run check`; it rejects IDs that don't look like UPI IDs.
4. With an ID set, every paid card gets a "Pay Rs. X by UPI" button. It opens a sheet with a QR code (computers), an "Open UPI app" button (phones), the UPI ID with a Copy button, and "I've paid · send my details", which opens the form with a UPI transaction ID field. The small print switches to `note_with_upi` in `content/pricing.yaml`.
5. Suggest they test once with the smallest plan from their own phone before announcing it.

Good to know: some UPI apps block "pay with amount" links to personal UPI IDs for security. If people report that, a business/merchant UPI ID (e.g. from a GPay for Business or PhonePe Business account) works best. The QR code and the copy-UPI-ID fallback still work either way.

## Turn UPI payments off

Set `upi_id: ""`. The buttons disappear and the original "free 15-minute call first" note returns.
