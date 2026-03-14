export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.instagram.com/bikers_choice_kakinada/?__a=1&__d=dis",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json",
        },
      }
    );

    const text = await response.text();

    let followers = 0;

    try {
      const json = JSON.parse(text);
      followers =
        json?.graphql?.user?.edge_followed_by?.count || 0;
    } catch {
      const match = text.match(
        /"edge_followed_by":\{"count":(\d+)\}/
      );
      followers = match ? parseInt(match[1]) : 0;
    }

    res.status(200).json({ followers });
  } catch (err) {
    res.status(500).json({ error: "fetch failed" });
  }
}
