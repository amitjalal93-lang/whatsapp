import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore.js";

let socket = null;

export const initializeeSocket = () => {
  if (socket) {
    return socket;
  }
  const user = useUserStore.getState().user;
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  //   connections events

  socket.on("connect", () => {
    console.log("socket connected", user._id);
    socket.emit("user_connected", user._id);
  });

  socket.on("connect_error", (error) => {
    console.error("socket connection error", error);
  });

  // discocnnected
  socket.on("disconnect", () => {
    console.log("soket disconnected", socket.id);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
