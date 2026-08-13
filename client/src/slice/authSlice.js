import axios from "axios";
import apiClient from "../utils/apiClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create asyncthunk
export const loginCall = createAsyncThunk(
  "loginCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = `/auth/login`;
      const res = await apiClient.post(apiUrl, payload);
      return res.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response);
      } else {
        throw error;
      }
    }
  }
);

const initialState = {
  currentUser: localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : {},
  loading: false,
  isSuccess: false,
  isReady: false,
  message: "",
  alreadyLoggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    LOG_OUT(state, action) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("jwtToken");
      window.location = "/";
    },
    UPDATE_PASSWORD_EXPIRY(state, action) {
      state.currentUser = {
        ...state.currentUser,
        passwordExpiry: action.payload,
      };
      localStorage.setItem("currentUser", JSON.stringify(state.currentUser));
    },
    UPDATE_CURRENT_USER(state, action) {
      state.currentUser = {
        ...state.currentUser,
        user: {
          ...state.currentUser.user,
          ...action.payload,
        },
      };
      localStorage.setItem("currentUser", JSON.stringify(state.currentUser));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginCall.pending, (state) => {
      state.loading = true;
      state.isSuccess = false;
      state.isReady = false;
      state.message = "";
      state.alreadyLoggedIn = false;
    });
    builder.addCase(loginCall.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.currentUser = payload;
      state.isSuccess = true;
      state.message = "";
      localStorage.setItem("currentUser", JSON.stringify(payload));
      localStorage.setItem("jwtToken", payload.token);
      state.isReady = true;
    });
    builder.addCase(loginCall.rejected, (state, { payload }) => {
      state.message = payload?.data?.error || payload?.error || "Login failed";
      state.alreadyLoggedIn = Boolean(payload?.data?.alreadyLoggedIn);
      state.loading = false;
      state.isSuccess = false;
      state.isReady = false;
    });
  },
});

export const { LOG_OUT, UPDATE_PASSWORD_EXPIRY, UPDATE_CURRENT_USER } =
  authSlice.actions;

export const selectUserInfo = (state) => state?.userInfo?.currentUser?.user?.name;
export const selectCurrentUser = (state) => state?.userInfo?.currentUser;
export const selectPasswordExpiry = (state) =>
  state?.userInfo?.currentUser?.passwordExpiry;
export const selectUserRole = (state) =>
  state?.userInfo?.currentUser?.user?.role || "USER";
export const selectIsAuthenticated = (state) =>
  Boolean(state?.userInfo?.currentUser?.token);
export const isSuccess = (state) => state?.userInfo?.isSuccess;
export const isReady = (state) => state?.userInfo?.isReady;
export const loading = (state) => state?.userInfo?.loading;
export const message = (state) => state?.userInfo?.message;
export const alreadyLoggedIn = (state) => state?.userInfo?.alreadyLoggedIn;
export default authSlice.reducer;
