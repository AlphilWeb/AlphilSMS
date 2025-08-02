// src/lib/api.ts

export async function fetchAPI<T = unknown>(
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
    const isJson = contentType?.includes("application/json") ?? false;

    let data: T;
    if (isJson) {
      data = (await res.json()) as T;
    } else {
      // If not JSON, we'll cast the text to T
      // This preserves backward compatibility while being type-safe
      data = (await res.text()) as unknown as T;
    }

    if (!res.ok) {
      throw new Error(
        `API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`
      );
    }

    return { data, status: res.status };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Something went wrong while fetching data.";
    console.error("Fetch API Error:", errorMessage);
    throw new Error(errorMessage);
  }
}