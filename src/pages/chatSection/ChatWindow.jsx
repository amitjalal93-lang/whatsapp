import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { usechatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whatsappImage from "../../images/whatsapp_image.png";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from "emoji-picker-react";
const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};
const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    cleanup,
    addReaction,
    deleteMessage,
  } = usechatStore();

  // get online status and last seen

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some(
          (participant) => participant._id === selectedContact?._id
        )
      );

      if (conversation?._id) {
        fetchMessages(conversation._id);
      }
    }
  }, [selectedContact, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "seen";
      formData.append("messageStatus", status);

      if (message.trim()) {
        formData.append("content", message.trim());
      }
      // if there is file include that too
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      if (!message.trim() && !selectedFile) return;
      await sendMessage(formData);
      // clear state
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.error("faild to send message", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }
    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "  yyyy  MMMM d");
    }
    return (
      <div className="flex justify-center my-4   ">
        <span
          className={`px-4 py-2 rounded-full text-sm ${
            theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  // group message
  const groupMessages = Array.isArray(messages)
    ? messages.reduce((acc, msg) => {
        if (!msg.createdAt) return acc;

        const date = new Date(msg.createdAt);

        if (isValidate(date)) {
          const dateString = format(date, "yyyy-MM-dd");

          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(msg);
        } else {
          console.log("invalid date for message", msg);
        }
        return acc;
      }, {})
    : {};

  console.log("emssa", messages, groupMessages);

  const handleReaction = (emoji, messageId) => {
    addReaction(messageId, emoji);
  };

  if (!selectedContact) {
    return (
      <div className="flex text-center mx-auto flex-1 flex-col items-center justify-center h-screen">
        <div className="max-w-md">
          <img src={whatsappImage} alt="chat-app" className="w-full h-auto" />
          <h2
            className={`text-3xl font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Select a conversation to start chatting
          </h2>
          <h2
            className={`  mb-6 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Choose a contact from on the left to begin messaging
          </h2>
          <h2
            className={`  mt-8 text-sm flex items-center justify-center gap-2 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            <FaLock className="w-4 h-4" />
            Your personal messages are end-to-end encrypted
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen w-full flex flex-col">
      <div
        className={`p-4 ${
          theme === "dark"
            ? "bg-[#303430] text-white"
            : "bg-[rgb(239,242,245)]  text-gray-600"
        } flex items-center`}
      >
        <button
          className="mr-2 focus:outline-none"
          onClick={() => setSelectedContact(null)}
        >
          <FaArrowLeft className="w-6 h-6 mr-2" />
        </button>

        <img
          src={selectedContact?.profilePicture}
          alt={selectedContact?.username}
          className="w-10 h-10 rounded-full"
        />

        <div className="ml-3 grow">
          <h1 className="font-semibold text-start">
            {selectedContact?.username}
          </h1>
          {isTyping ? (
            <div>Typing...</div>
          ) : (
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {online
                ? "online"
                : lastSeen
                ? `last seen ${format(new Date(lastSeen), "h:mm")}`
                : "offline"}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button className="focus:outline-none">
            <FaVideo className="w-6 h-6" />
          </button>
          <button className="focus:outline-none">
            <FaEllipsisV className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/*  */}
      <div
        className={`flex-1 overflow-y-auto ${
          theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"
        }`}
      >
        {Object.entries(groupMessages).map(([date, msgs]) => (
          <React.Fragment key={date}>
            {renderDateSeparator(new Date(date))}
            {msgs
              .filter(
                (msg) => msg.conversation === selectedContact?.conversation?._id
              )
              .map((msg) => (
                <MessageBubble
                  key={msg._id || msg.tempId}
                  message={msg}
                  theme={theme}
                  currentUser={user}
                  onReact={handleReaction}
                  deleteMessage={deleteMessage}
                />
              ))}
          </React.Fragment>
        ))}

        <div ref={messageEndRef} />
      </div>
      {filePreview && (
        <div className="relative p-2">
          <img
            src={filePreview}
            alt="file_preview"
            className="w-80 object-cover rounded shadow-lg mx-auto"
          />
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}
      <div
        className={`p-4 ${
          theme === "dark" ? "bg-[#303430]" : "bg-white"
        } flex items-center space-x-2 relative `}
      >
        <button
          className="focus:outline-none"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile
            className={`h-6 w-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          />
        </button>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute left-0 bottom-16 z-50">
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setMessage((prev) => prev + emojiObject.emoji);
                setShowEmojiPicker(false);
              }}
              theme={theme}
            />
          </div>
        )}

        <div className="relative">
          <button
            className="focus:outline-none"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <FaPaperclip
              className={`h-6 w-6 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              } mt-2 `}
            />
          </button>
          {showFileMenu && (
            <div
              className={`absolute bottom-full left-0 mb-2 ${
                theme === "dark" ? "bg-gray-700" : "bg-white"
              } rounded-lg shadow-lg `}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current.click()}
                className={`flex items-center px-4 py-2 w-full transition-colors   ${
                  theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"
                }`}
              >
                <FaImage className="mr-2" /> Image/Video
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                className={`flex items-center px-4 py-2 w-full transition-colors   ${
                  theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"
                }`}
              >
                <FaFile className="mr-2" /> Documents
              </button>
            </div>
          )}
        </div>

        {/* input */}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Type a message"
          className={`grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 
            ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-gray-100 text-black border-gray-300"
            } `}
        />

        <button onClick={handleSendMessage} className="focus:outline-none">
          <FaPaperPlane className="h-6 w-6 text-green-500" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
