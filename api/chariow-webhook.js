import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée",
    });
  }

  try {
    const data = req.body;

    console.log(JSON.stringify(data, null, 2));

    const email = data.customer?.email;
    const status = data.sale?.status;

    if (status === "completed" && email) {

      const filePath = path.join(process.cwd(), "premium-users.json");

      let users = [];

      if (fs.existsSync(filePath)) {
        users = JSON.parse(fs.readFileSync(filePath));
      }

      if (!users.includes(email)) {
        users.push(email);

        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      }

      console.log("Utilisateur premium ajouté :", email);
    }

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