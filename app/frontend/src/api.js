const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      "No se pudo conectar con el backend. Verificá que FastAPI esté ejecutándose.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? data.detail || data.message
        : data;

    const message = Array.isArray(detail)
      ? detail
          .map((item) =>
            typeof item === "object"
              ? `${item.loc?.join(".") || "Campo"}: ${item.msg}`
              : String(item),
          )
          .join(". ")
      : detail;

    throw new Error(
      message || `Error HTTP ${response.status}`,
    );
  }

  return data;
}

export const api = {
  health() {
    return request("/health");
  },

  predictCustomer(customer) {
    return request("/api/v1/churn/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
  },

  predictDataset(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/v1/churn/datasets/predict", {
      method: "POST",
      body: formData,
    });
  },

  listCustomers(datasetId, { risk, search, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    if (risk && risk !== "ALL") params.set("risk", risk);
    if (search?.trim()) params.set("search", search.trim());

    return request(
      `/api/v1/churn/datasets/${encodeURIComponent(datasetId)}/customers?${params}`,
    );
  },

  getCustomer(datasetId, customerId) {
    return request(
      `/api/v1/churn/datasets/${encodeURIComponent(datasetId)}/customers/${encodeURIComponent(customerId)}`,
    );
  },

  getDashboard(datasetId) {
    return request(
      `/api/v1/churn/datasets/${encodeURIComponent(datasetId)}/dashboard`,
    );
  },

  getInterpretability() {
    return request("/api/v1/churn/interpretability");
  },
};

export { API_URL };