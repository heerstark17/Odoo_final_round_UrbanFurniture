import api from "./api";

function mapContactToRequestBody(contact) {
  return {
    name: contact.name,
    contactType: contact.contactType,
    email: contact.email,
    phone: contact.phone,
    city: contact.city,
    state: contact.state,
    pincode: contact.pincode,
    profileImageUrl: contact.profileImageUrl || "",
  };
}

export async function getAnalyticAccounts() {
  const response = await api.get("/analytic-accounts");
  return response.data || [];
}

export async function createAnalyticAccount(data) {
  const response = await api.post("/analytic-accounts", {
    name: data.name,
    analyticType: data.analyticType,
  });

  return response.data;
}

export async function updateAnalyticAccount(id, data) {
  const response = await api.put(`/analytic-accounts/${id}`, {
    name: data.name,
    analyticType: data.analyticType,
  });

  return response.data;
}

export async function archiveAnalyticAccount(id) {
  const response = await api.delete(`/analytic-accounts/${id}`);
  return response.data.analyticAccount;
}

export async function getContacts() {
  const response = await api.get("/contacts");
  return response.data.data;
}

export async function createContact(contactData) {
  const body = mapContactToRequestBody(contactData);
  const response = await api.post("/contacts", body);
  return response.data.data ?? response.data;
}

export async function updateContact(id, contactData) {
  const body = mapContactToRequestBody(contactData);
  const response = await api.put(`/contacts/${id}`, body);
  return response.data.data ?? response.data;
}

export async function archiveContact(id) {
  const response = await api.delete(`/contacts/${id}`);
  return response.data.data ?? response.data;
}

function mapProductFromApi(product) {
  return {
    ...product,
    type: product.product_type,
    sales_price: product.sales_price,
    cost: product.purchase_price,
    archived: product.is_active === false,
  };
}

function mapProductToApi(product) {
  return {
    name: product.name,
    productType: product.type,
    category: product.category,
    salesPrice: Number(product.sales_price),
    purchasePrice: Number(product.cost),
    imageUrl: product.imageUrl || "",
  };
}

export async function getProducts() {
  const response = await api.get("/products");

  return (response.data || []).map(mapProductFromApi);
}

export async function createProduct(productData) {
  const response = await api.post(
    "/products",
    mapProductToApi(productData)
  );

  return mapProductFromApi(response.data);
}

export async function updateProduct(id, productData) {
  const response = await api.put(
    `/products/${id}`,
    mapProductToApi(productData)
  );

  return mapProductFromApi(response.data);
}

export async function archiveProduct(id) {
  const response = await api.delete(`/products/${id}`);

  return mapProductFromApi(response.data.product);
}