async function getApiRequest() {
  const { apiRequest } = await import('./mobileApi.js');
  return apiRequest;
}

export async function listMyMessages(limit = 50, requestFn) {
  const resolvedRequestFn = requestFn || (await getApiRequest());
  const payload = await resolvedRequestFn(`/api/account/messages?limit=${encodeURIComponent(String(limit || 50))}`);
  return payload?.data || [];
}
