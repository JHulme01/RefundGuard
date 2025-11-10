const today = new Date();

const subtractDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy.toISOString().split('T')[0];
};

const demoProducts = [
  {
    id: 'prod-growth-lab',
    name: 'Growth Lab Mastermind',
    price: 297
  },
  {
    id: 'prod-automation-suite',
    name: 'Automation Suite Annual',
    price: 1499
  },
  {
    id: 'prod-swipefile',
    name: 'Creator Swipe File',
    price: 79
  }
];

const demoRequests = [
  {
    id: 'req-001',
    purchaseId: 'pur-001',
    memberId: 'mem-011',
    productId: 'prod-growth-lab',
    memberName: 'Alex Rivera',
    productName: 'Growth Lab Mastermind',
    price: 297,
    purchaseDate: subtractDays(today, 6),
    daysSincePurchase: 6,
    status: 'pending',
    reason: 'Looking for something more advanced.'
  },
  {
    id: 'req-002',
    purchaseId: 'pur-002',
    memberId: 'mem-021',
    productId: 'prod-automation-suite',
    memberName: 'Jules Bennett',
    productName: 'Automation Suite Annual',
    price: 1499,
    purchaseDate: subtractDays(today, 18),
    daysSincePurchase: 18,
    status: 'pending',
    reason: 'Did not realize it was an annual plan.'
  },
  {
    id: 'req-003',
    purchaseId: 'pur-003',
    memberId: 'mem-031',
    productId: 'prod-swipefile',
    memberName: 'Kai Laurent',
    productName: 'Creator Swipe File',
    price: 79,
    purchaseDate: subtractDays(today, 2),
    daysSincePurchase: 2,
    status: 'pending',
    reason: 'Accidental purchase request.'
  },
  {
    id: 'req-004',
    purchaseId: 'pur-004',
    memberId: 'mem-041',
    productId: 'prod-growth-lab',
    memberName: 'Morgan Lee',
    productName: 'Growth Lab Mastermind',
    price: 297,
    purchaseDate: subtractDays(today, 29),
    daysSincePurchase: 29,
    status: 'pending',
    reason: 'No longer building a community.'
  },
  {
    id: 'req-005',
    purchaseId: 'pur-005',
    memberId: 'mem-051',
    productId: 'prod-automation-suite',
    memberName: 'Chris Patel',
    productName: 'Automation Suite Annual',
    price: 1499,
    purchaseDate: subtractDays(today, 1),
    daysSincePurchase: 1,
    status: 'pending',
    reason: 'Needs team approval first.'
  }
];

export default {
  products: demoProducts,
  requests: demoRequests
};

