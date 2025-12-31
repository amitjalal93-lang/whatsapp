import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import {
  apiDeleteRequestAuthenticated,
  apiFilePostRequestAuthenticated,
  apiGetRequestAuthenticated,
  apiPutRequestAuthenticated,
} from "../services/url.service";

export const usechatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),
  // socket event listners setup
  initsocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    //remove exiting listerners to prevent duplicate handlers
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");

    // listen for incoming messsages
    socket.on("receive_message", (message) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    //  confirm message dilivery

    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg
        ),
      }));
    });
    // update message status

    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg
        ),
      }));
    });

    // handle reaction on message

    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
    });

    // handle remove message from local state

    socket.on("message", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    // handle any message sending error
    socket.on("message_error", (error) => {
      console.log("message error", error);
    });

    // lestner for typing users
    socket.on("user_typing", ({ conversationId, userId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }

        return {
          typingUsers: newTypingUsers,
        };
      });
    });

    // track user online/offline status
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return {
          onlineUsers: newOnlineUsers,
        };
      });
    });

    // emit status check for all users in conversation list

    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data?.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== get().currentUser._id
        );
        if (otherUser._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });
              return {
                onlineUsers: newOnlineUsers,
              };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiGetRequestAuthenticated("/chat/conversations");
      set({ conversations: data, loading: false });

      get().initsocketListeners();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });

      return null;
    }
  },
  // fetch message for a conversation
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;

    set({ loading: true, error: null });
    try {
      const { data } = await apiGetRequestAuthenticated(
        `/chat/conversations/${conversationId}/messages`
      );
      const messageArray = data.data || data || [];
      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      // mark unread message as read
      const { markMessagesAsRead } = get();
      markMessagesAsRead();
      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });

      return [];
    }
  },

  // send message in real time

  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const messageStatus = formData.get("messageStatus");
    const content = formData.get("content");
    const media = formData.get("media");

    const socket = getSocket();

    const { conversations } = get();
    let conversationId = null;
    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId)
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }
    // temp message before actula response

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await apiFilePostRequestAuthenticated(
        "/chat/send-message",
        formData
      );

      const messageData = data.data || data;
      // replace optimisitic message with real one

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg
        ),
      }));

      socket.emit("send_message", messageData);

      return messageData;
    } catch (error) {
      console.log("Error sending message", error);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  receiveMessage: (message) => {
    if (!message) return;
    const { currentConversation, currentUser, messages } = get();

    const messageExits = message.some((msg) => msg._id === message._id);
    if (messageExits) return;

    if (message.conversation === currentConversation) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
      // automaticallyt mark as read

      if (message.receiver?._id === currentUser?._id) {
        get().markMessagesAsRead();
      }
    }
    set((state) => {
      const updateConversations = state.conversation?.data?.map((conv) => {
        if (conv._id === message.conversation) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message?.receiver?._id === currentUser?._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });
      return {
        conversations: {
          ...state.conversations,
          data: updateConversations,
        },
      };
    });
  },
  //  mark as read

  maskMessagesAsRead: async () => {
    const { messages, currentUser } = get();

    if (!messages.length || !currentUser) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" && msg.receiver?._id === currentUser?._id
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    try {
      const { data } = await apiPutRequestAuthenticated("/chat/messages/read", {
        messageIda: unreadIds,
      });

      console.log("message mark as read", data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
        ),
      }));

      const socket = getSocket();

      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("failed to mark message as read ", error);
    }
  },

  // delete message

  deleteMessage: async (messageId) => {
    try {
      await apiDeleteRequestAuthenticated(`/chat/messages/${messageId}`);

      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    } catch (error) {
      console.error("delete message", error);
      set({ error: error?.response?.data?.message || error?.message });
      return false;
    }
  },

  // add change reactions

  addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
      console.log("hi", messageId, emoji, currentUser?._id);
      socket.emit("add_reaction", {
        messageId,
        emoji,
        reactionUserId: currentUser?._id,
      });
    }
  },
  //   start typing
  startTyping: async (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();

    if (socket && currentConversation) {
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },
  // stop typing
  stopTyping: async (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();

    if (socket && currentConversation) {
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  // user typing

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }

    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
