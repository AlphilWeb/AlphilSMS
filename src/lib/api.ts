// src/lib/api.ts

export async function fetchAPI<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; status: number }> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include", 

      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      throw new Error(
        `API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`
      );
    }

    return { data, status: res.status };
  } catch (error: any) {
    console.error("Fetch API Error:", error.message);
    throw new Error(error.message || "Something went wrong while fetching data.");
  }
}
