import React, { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

function Chatlist() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) return; // Ensure currentUser is available
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        try {
          const data = res.data();
          const items = data?.chats || []; // Safely handle undefined or missing data
          if (items.length === 0) {
            setChats([]);
            return;
          }

          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);
            const user = userDocSnap.data();
            return { ...item, user };
          });

          const chatData = await Promise.all(promises);
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch (error) {
          console.error("Failed to fetch chats:", error);
        }
      }
    );
    return () => {
      unSub();
    };
  }, [currentUser?.id]);
  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );
    userChats[chatIndex].isSeen = true;
    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };
  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );
  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "/plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {/* {chats.map((chat) => (
        <div className="item" key={chat.chatId}>
          <img src={user.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user.username}</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))} */}
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
        >
          <img src={chat.user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{chat.user?.username}</span>
            <p style={{ color: chat.isSeen ? "#888" : "#F11A7B" }}>
              {chat.lastMessage}
            </p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
}

export default Chatlist;
