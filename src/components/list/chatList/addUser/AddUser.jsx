import React, { useState } from "react";
import "./addUser.css";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";

function AddUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setUser(null); // Reset user state before a new search
    const formData = new FormData(e.target);
    const username = formData.get("username");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const userRef = collection(db, "users"); // Assuming it's "users" instead of "cities"
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      } else {
        setError("User not found.");
      }
    } catch (err) {
      setError("An error occurred while searching.");
    } finally {
      setLoading(false); // End loading
    }
  };
  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");
    try {
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="addUser">
      <div className="overlay">
        <form onSubmit={handleSearch}>
          <input type="text" name="username" placeholder="Username" />
          <button>Search</button>
        </form>

        <div className="load">
          {loading && (
            <p style={{ display: user ? "none" : "block" }}>Searching...</p>
          )}
          {error && <p className="error">{error}</p>}
        </div>

        {user && (
          <div className="user">
            <div className="detail">
              <img src={user.avatar || "./avatar.png"} alt="avatar" />
              <span>{user.username}</span>
            </div>
            <button onClick={handleAdd}>Add User</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddUser;
