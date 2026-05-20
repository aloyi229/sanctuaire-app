export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée",
    });
  }

  try {
    const data = req.body;

    console.log("Paiement reçu :", data);

    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}