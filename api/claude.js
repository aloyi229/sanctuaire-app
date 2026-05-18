export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée",
    });
  }

  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: JSON.stringify(data),
      });
    }

    return res.status(200).json({
      text: data.content?.[0]?.text || "Aucune réponse",
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}