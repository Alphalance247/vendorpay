const API_KEY = "PASTE_YOUR_KEY_HERE";

export const getCountries = async () => {
  console.log("API KEY:", API_KEY ? "Key exists" : "Key is missing");

  const url = "https://api.restcountries.com/countries/v5?q=canada";

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer rc_live_c0ddb7474b46416abcde747c0d25516d`,
      },
    });

    console.log("REST Countries status:", response.status);

    const data = await response.json();

    console.log("REST Countries response:", data);

    if (!response.ok) {
      throw new Error(
        data?.errors?.[0]?.message ||
          `REST Countries returned ${response.status}`,
      );
    }

    return data?.data?.objects || [];
  } catch (error) {
    console.error("Countries API error:", error);
    throw error;
  }
};
