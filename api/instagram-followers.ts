export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://i.instagram.com/api/v1/users/web_profile_info/?username=bikers_choice_kakinada",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const data = await response.json();

    const followers =
      data?.data?.user?.edge_followed_by?.count || "0";

    res.status(200).json({ followers });
  } catch (error) {
    res.status(500).json({ followers: "0" });
  }
}
