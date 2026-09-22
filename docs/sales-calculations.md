# Sales Calculations

This document explains the money and weight math on the Sell (POS) screen and the Sales History list.

Source screens:
1. Sell / Complete Sale (`app/dashboard/sell/page.js`)
2. Sales History (`app/dashboard/sales/page.js`)


# 1. Sell (POS)

## Weight units

The system uses two linked weight fields:

1. WT (VORI)
2. WT (GRAM)

Conversion constant:

`1 VORI = 116.64 GRAM`

Formulas:

1. Gram from Vori: `gram = vori * 116.64`
2. Vori from Gram: `vori = gram / 116.64`

Example from the POS screen:

1. 3 VORI → `3 * 116.64 = 349.9200` GRAM
2. 2 VORI → `2 * 116.64 = 233.2800` GRAM


## Line item amount

Each cart line starts in a BDT base amount:

`line_bdt = rate_per_vori * wt_vori`

If the line currency is AED, divide by the AED rate to show AED:

`line_aed = line_bdt / aed_rate`

If the line currency is BDT, the displayed line total stays as `line_bdt`.


### Example item 1 (CFD)

Inputs:

1. WT (VORI) = 3
2. RATE / VORI = 2200
3. CURRENCY = AED
4. AED RATE = 32

Steps:

1. `line_bdt = 3 * 2200 = 6600`
2. `line_aed = 6600 / 32 = 206.2500`

Shown subtotal: `AED 206.2500`


### Example item 2 (CFD)

Inputs:

1. WT (VORI) = 2
2. RATE / VORI = 2200
3. CURRENCY = AED
4. AED RATE = 32

Steps:

1. `line_bdt = 2 * 2200 = 4400`
2. `line_aed = 4400 / 32 = 137.5000`

Shown subtotal: `AED 137.5000`


## Invoice summary (right panel)

Cart Items / Subtotal:

`subtotal = sum of all line display amounts`

With both CFD lines:

`206.2500 + 137.5000 = 343.7500 AED`

Discount:

`grand_total = subtotal - discount`

If discount is 0:

`grand_total = 343.7500 AED`

Paid and Due:

1. Paid is the amount entered as paid
2. `due = max(grand_total - paid, 0)`

On the sample screen paid is 0, so:

1. Grand Total = `AED 343.7500`
2. Due Amount = `AED 343.7500`
3. Payment Status = Full Due


## How AED is stored on the invoice

When any cart line uses AED, the pay mode is saved with the rate, for example:

`Cash (AED @ 32)`

Sales History later reads that string to decide whether to show AED or BDT.


# 2. Sales History

## Columns

For each invoice row:

1. Qty = sum of all line `qty` values (VORI)
2. Total = `sub_total - discount`
3. Paid = `paid_amount`
4. Due = `max(Total - Paid, 0)`

Currency display:

1. If `pay_mode` contains `(AED @ ...)`, show AED
2. Otherwise show BDT


## Sample invoice match

Sales History row:

1. Invoice ID: `INV-2026-09-21-164100`
2. Date: 9/21/2026
3. Customer: DLP
4. Qty: `5.0000`
5. Total: `AED 343.7500`
6. Paid: `AED 0.0000`
7. Due: `AED 343.7500`

This matches the POS cart above:

1. Qty: `3 + 2 = 5` VORI
2. Total: `206.2500 + 137.5000 = 343.7500` AED
3. Due: `343.7500 - 0 = 343.7500` AED


# Quick formula sheet

POS line (BDT base):

`rate_per_vori * wt_vori`

POS line (AED display):

`(rate_per_vori * wt_vori) / aed_rate`

Weight:

`gram = vori * 116.64`

Invoice:

1. `subtotal = sum(line amounts)`
2. `grand_total = subtotal - discount`
3. `due = max(grand_total - paid, 0)`

Sales History:

1. `qty = sum(line qty)`
2. `total = sub_total - discount`
3. `due = max(total - paid, 0)`
