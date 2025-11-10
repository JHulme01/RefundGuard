const demoPurchases = [
  {
    id: 'pur-001',
    memberName: 'Alex Rivera',
    memberEmail: 'alex@demo.com',
    productId: 'prod-growth-lab',
    productName: 'Growth Lab Mastermind',
    purchaseDate: new Date().toISOString(),
    amount: 29700,
    currency: 'USD'
  },
  {
    id: 'pur-002',
    memberName: 'Jules Bennett',
    memberEmail: 'jules@demo.com',
    productId: 'prod-automation-suite',
    productName: 'Automation Suite Annual',
    purchaseDate: new Date().toISOString(),
    amount: 149900,
    currency: 'USD'
  }
];

const demoRefundRequests = [
  {
    id: 'req-001',
    purchaseId: 'pur-001',
    memberName: 'Alex Rivera',
    memberEmail: 'alex@demo.com',
    productName: 'Growth Lab Mastermind',
    daysSincePurchase: 6,
    reason: 'Looking for something more advanced.',
    amount: 297,
    currency: 'USD'
  },
  {
    id: 'req-002',
    purchaseId: 'pur-002',
    memberName: 'Jules Bennett',
    memberEmail: 'jules@demo.com',
    productName: 'Automation Suite Annual',
    daysSincePurchase: 18,
    reason: 'Did not realize it was an annual plan.',
    amount: 1499,
    currency: 'USD'
  }
];

export { demoPurchases, demoRefundRequests };

