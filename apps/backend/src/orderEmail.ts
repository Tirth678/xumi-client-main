export interface EmailOrder {
  id: string;
  customer_name: string;
  user_email: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  currency: string;
  created_at: string;
  booking_expires_at: string | null;
  payment_url: string | null;
}

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const date = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function preorderEmail(order: EmailOrder) {
  const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(value);
  const deadline = order.booking_expires_at ?? new Date(new Date(order.created_at).getTime() + 15 * 86400000).toISOString();
  const total = money(Number(order.total_amount));
  // Only display a real, secure payment link. A missing link uses the reply instruction.
  const paymentUrl = order.payment_url && /^https:\/\//i.test(order.payment_url) ? order.payment_url : null;
  const text = `ROBOCRAFT — Pre-order confirmed\n\nThanks, ${order.customer_name} — your pre-order is in.\nWe have reserved your place in the production queue for ${order.product_name}. Your slot is confirmed once payment is received.\n\nOrder: #${order.id}\nPlaced: ${date(order.created_at)}\n${order.product_name}\nQty ${order.quantity} · ${money(Number(order.unit_price))} each\nTotal: ${total}\n\nPayment due: ${total}\nPlease complete payment by ${date(deadline)} (15 days from your pre-order date). After that the slot is released to the next customer.\n${paymentUrl ? `Complete payment: ${paymentUrl}\nOr reply` : 'Reply'} to this email — we will send a payment link and receipt.\n\nWhat happens next\n1. Production — your unit is queued and assembly begins once payment clears.\n2. Testing — every unit is calibrated and tested before it ships.\n3. Shipping — we email tracking details as soon as it leaves the studio.\n\nQuestions about this order? Reply to this email or write to support@robocraft.com.\nYou are receiving this because you placed a pre-order with RoboCraft.\nSent to ${order.user_email} · RoboCraft Studio, India\n© ${new Date(order.created_at).getFullYear()} RoboCraft Studio. All rights reserved.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f1;color:#202020;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:white;border-radius:16px" cellspacing="0" cellpadding="28"><tr><td><table width="100%"><tr><td><strong>ROBOCRAFT</strong></td><td align="right" style="color:#647064">Pre-order confirmed</td></tr></table><h1 style="font-size:26px">Thanks, ${escape(order.customer_name)} — your pre-order is in.</h1><p style="line-height:1.7">We have reserved your place in the production queue for ${escape(order.product_name)}. Your slot is confirmed once payment is received.</p><table width="100%" cellpadding="8"><tr><td>Order<br><strong>#${escape(order.id)}</strong></td><td>Placed<br><strong>${date(order.created_at)}</strong></td></tr></table><h2>${escape(order.product_name)}</h2><p>Qty ${order.quantity} · ${money(Number(order.unit_price))} each</p><table width="100%" cellpadding="8"><tr><td>Subtotal</td><td align="right">${money(Number(order.unit_price) * order.quantity)}</td></tr><tr><td><strong>Total</strong></td><td align="right"><strong>${total}</strong></td></tr></table><div style="padding:24px;background:#f3f5ef;border-radius:12px;margin-top:20px"><strong>Payment due</strong><h2>${total}</h2><p style="line-height:1.7">Please complete payment by <strong>${date(deadline)}</strong> (15 days from your pre-order date). After that the slot is released to the next customer.</p>${paymentUrl ? `<a href="${escape(paymentUrl)}" style="display:inline-block;padding:14px 24px;background:#202c23;color:white;text-decoration:none;border-radius:8px">Complete payment</a><p>Or reply` : '<p>Reply'} to this email — we will send a payment link and receipt.</p></div><h2>What happens next</h2><ol style="padding-left:22px;line-height:1.8"><li><strong>Production</strong> — your unit is queued and assembly begins once payment clears.</li><li><strong>Testing</strong> — every unit is calibrated and tested before it ships.</li><li><strong>Shipping</strong> — we email tracking details as soon as it leaves the studio.</li></ol><p style="line-height:1.7">Questions about this order? Reply to this email or write to <a href="mailto:support@robocraft.com">support@robocraft.com</a>.</p><hr style="border:0;border-top:1px solid #eee"><p style="font-size:12px;color:#777;line-height:1.8">You are receiving this because you placed a pre-order with RoboCraft.<br>Sent to ${escape(order.user_email)} · RoboCraft Studio, India<br>© ${new Date(order.created_at).getFullYear()} RoboCraft Studio. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;
  return { html, text };
}
