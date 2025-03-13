import React, { useEffect, useRef, useState } from "react";
import {
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import { db } from "../../lib/firebase";
import "./chat.css";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

function Chat() {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false); // Track loading state
  const endRef = useRef(null);
  const { currentUser } = useUserStore();
  const { chatId, user } = useChatStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (chatId) {
      const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
        setChat(res.data());
      });
      return () => {
        unSub();
      };
    }
  }, [chatId]);

  // Handle image file selection
  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // Handle emoji selection
  const handleEmoji = (e) => {
    setText((prev) => prev + " " + e.emoji);
    setOpen(false);
  };

  // Handle sending the message with or without an image
  const handleSelect = async () => {
    // Don't send empty message (text and image both are empty)
    if (text.trim() === "" && !img.file) return;

    setLoading(true); // Start loading state

    // Start uploading the image asynchronously
    let imgUrl = null;
    if (img.file) {
      const uploadTask = upload(img.file); // Start the upload in parallel
      imgUrl = await uploadTask; // Wait for the image upload to complete
    }

    // Create message object
    const message = {
      senderId: currentUser.id,
      text: text.trim(),
      createdAt: new Date(),
      ...(imgUrl && { img: imgUrl }), // Add image URL if available
    };

    // Start Firestore batch operation for updating both messages and user chats
    const batch = writeBatch(db);

    // Add message to chat
    const chatRef = doc(db, "chats", chatId);
    batch.update(chatRef, {
      message: arrayUnion(message),
    });

    // Update user chats
    const userIds = [currentUser.id, user.id];
    for (let id of userIds) {
      const userChatsRef = doc(db, "userchats", id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();
        const chatIndex = userChatsData.chats.findIndex(
          (c) => c.chatId === chatId
        );

        if (chatIndex !== -1) {
          userChatsData.chats[chatIndex].lastMessage = text.trim() || "Image";
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          batch.update(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      }
    }

    try {
      // Commit the batch update (both the chat and user chats update)
      await batch.commit();
      setText(""); // Clear text after sending
      setImg({ file: null, url: "" }); // Clear image preview
    } catch (err) {
      console.log("Error sending message:", err);
    } finally {
      setLoading(false); // Stop loading after everything is done
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        {chat?.message?.map((message, index) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={index}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="uploaded" />}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="preview" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder="Type a message ..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading} // Disable input when loading
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker
              lazyLoadEmojis={false}
              theme="dark"
              open={open}
              onEmojiClick={handleEmoji}
            />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSelect}
          disabled={loading} // Disable button when loading
        >
          {loading ? "Sending" : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
