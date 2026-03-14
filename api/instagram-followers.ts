export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.instagram.com/bikers_choice_kakinada/",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      }
    );

    const html = await response.text();

    const match = html.match(/"edge_followed_by":{"count":(\d+)}/);

    const followers = match ? parseInt(match[1]) : 0;

    res.status(200).json({ followers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch followers" });
  }
}
