import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import {
  apiDeleteRequestAuthenticated,
  apiGetRequestAuthenticated,
  apiPostRequestAuthenticated,
} from "../services/url.service";

const useStatusStore = create((set, get) => ({
  // stateve

  statuses: [],
  loading: false,
  error: null,

  // active
  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // initilizw the socket listerners

  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;
    // real time status event

    socket.on("user_status", (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some((s) => s._id === newStatus._id)
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    }),
      socket.on("status_deleted", (statusId) => {
        set((state) => ({
          statuses: state.statuses.filter((s) => s._id !== statusId),
        }));
      }),
      socket.on("status_viewed", (statusId, viewers) => {
        set((state) => ({
          statuses: state.statuses.map((status) =>
            status._id === statusId ? { ...status, viewers } : status
          ),
        }));
      });
  },

  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("user_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  // fetch status
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiGetRequestAuthenticated("status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.error("fetch status error", error);
      set({ error: error.message, loading: false });
    }
  },

  // create status

  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      if (statusData.file) {
        formData.append(" media", statusData.file);
      }
      if (statusData.content?.trim()) {
        formData.append("content", statusData.content);
      }

      const { data } = await apiPostRequestAuthenticated(
        "status",
        formData,

        { headers: { "content-type": "multipart/form-data" } }
      );

      // add to status in local state
      if (data.data) {
        set((state) => ({
          statuses: state.statuses.some((s) => s._id === data.data._id)
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }
      set({ loading: false });
      return data.data;
    } catch (error) {
      console.error("create status error", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // viewstatus
  viewStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await apiGetRequestAuthenticated(`status/${statusId}/view`);
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status } : status
        ),
      }));
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await apiDeleteRequestAuthenticated(`status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
      set({ loading: false });
    } catch (error) {
      console.error("delete status error", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getStatusViewers: async (statusId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await apiGetRequestAuthenticated(
        `status/${statusId}/viewers`
      );
      set({ loading: false });
      return data.data;
    } catch (error) {
      console.error("get status viewers error", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // helper function for grouped status

  getGroupedStatuses: () => {
    const { statuses } = get();
    return statuses.reduce((acc, status) => {
      const statusUserId = status.user?._id;
      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: status?.user?.username,
          avatar: status?.user?.profilePicture,
          statuses: [],
        };
      }
      acc[statusUserId].statuses.push({
        id: status._id,
        media: status.content,
        contentType: status.contentType,
        timestamp: status.createdAt,
        viewers: status.viewers,
      });

      return acc;
    }, {});
  },

  getUserStatuses: (userId) => {
    const groupedStatuses = get().getGroupedStatuses();
    return userId ? groupedStatuses[userId] : null;
  },

  getOtherStatuses: (userId) => {
    const groupedStatuses = get().getGroupedStatuses();
    return Object.values(groupedStatuses).filter(
      (contact) => contact.id !== userId
    );
  },
  // clear error
  clearError: () => set({ error: null }),

  reset: () => set({ statuses: [], loading: false, error: null }),
}));

export default useStatusStore;
