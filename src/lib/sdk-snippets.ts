"use client";

export const sdkSnippets: Record<string, string> = {
  curl: `curl https://api.xpayments.digital/api/v1/payments \\
  -H "Authorization: Bearer xp_live_9f2a4c1b" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4200,
    "currency": "EUR",
    "method": "pix",
    "customer": "cus_001",
    "description": "Pro Plan — Annual"
  }'`,
  node: `import { XPayments } from "@xpayments/node";

const xp = new XPayments(process.env.XP_SECRET_KEY);

const payment = await xp.payments.create({
  amount: 4200,
  currency: "EUR",
  method: "pix",
  customer: "cus_001",
  description: "Pro Plan — Annual",
});

console.log(payment.id, payment.status);`,
  python: `import xpayments

xp = xpayments.Client(api_key="xp_live_...")

payment = xp.payments.create(
    amount=4200,
    currency="EUR",
    method="pix",
    customer="cus_001",
    description="Pro Plan — Annual",
)

print(payment.id, payment.status)`,
  php: `<?php
require 'vendor/autoload.php';

$xp = new XPayments\\Client(getenv('XP_SECRET_KEY'));

$payment = $xp->payments->create([
    'amount' => 4200,
    'currency' => 'EUR',
    'method' => 'pix',
    'customer' => 'cus_001',
    'description' => 'Pro Plan — Annual',
]);

echo $payment->id;`,
  go: `package main

import (
    "context"
    "fmt"
    "github.com/xpayments/go-sdk/xp"
)

func main() {
    client := xp.New(os.Getenv("XP_SECRET_KEY"))
    p, err := client.Payments.Create(context.Background(), &xp.PaymentParams{
        Amount: 4200, Currency: "EUR", Method: "pix",
        Customer: "cus_001", Description: "Pro Plan — Annual",
    })
    if err != nil { panic(err) }
    fmt.Println(p.ID, p.Status)
}`,
};
