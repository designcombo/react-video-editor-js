export const callMcp = async (prompt) => {
    const url = "http://127.0.0.1:8080/openai";
    const headers = {
      "Content-Type": "application/json",
    };
    const body = JSON.stringify({ prompt });
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  };
  
  