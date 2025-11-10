import axios from 'axios';

const BASE_URL = process.env.WHOP_API_BASE_URL || 'https://api.whop.com';

function buildClient(accessToken) {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  instance.interceptors.request.use((config) => {
    const token = accessToken || process.env.WHOP_API_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

export async function fetchPurchases(accessToken) {
  if (!accessToken && !process.env.WHOP_API_TOKEN) {
    return [];
  }

  const response = await buildClient(accessToken).get('/v3/purchases?limit=50');
  return response.data?.data ?? [];
}

export async function createRefund({ purchaseId, amount, note, accessToken }) {
  if (!accessToken && !process.env.WHOP_API_TOKEN) {
    return { mock: true };
  }

  const response = await buildClient(accessToken).post(`/v3/purchases/${purchaseId}/refunds`, {
    amount,
    note
  });
  return response.data;
}

export async function revokeAccess({ productId, memberId, accessToken }) {
  if (!accessToken && !process.env.WHOP_API_TOKEN) {
    return { mock: true };
  }

  const response = await buildClient(accessToken).post(`/v3/products/${productId}/revoke`, {
    member_id: memberId
  });
  return response.data;
}

