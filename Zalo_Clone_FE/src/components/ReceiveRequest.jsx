export const getReceivedFriendRequests = async () => {
    try {
      const response = await fetch("/api/friend/received-requests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch received friend requests");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching received requests:", error);
      return [];
    }
  };