import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create asyncthunk
export const loginCall = createAsyncThunk(
  "loginCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = `/auth/login`;
      const res = await axios.post(apiUrl, payload);
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
  userInfo: localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    LOG_OUT(state, action) {
      localStorage.removeItem("currentUser");
      window.location = "/";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginCall.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(loginCall.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.userInfo = payload;
      state.isSuccess = true;
      state.message = "";
      localStorage.setItem("currentUser", JSON.stringify(payload));
      state.isReady = true;
    });
    builder.addCase(loginCall.rejected, (state, { payload }) => {
      state.message = payload.data.error;
      console.log(payload.data.error);
      state.loading = false;
      state.isSuccess = false;
      state.isReady = false;
    });
  },
});

export const { LOG_OUT } = authSlice.actions;

export const selectUserInfo = (state) => state?.userInfo?.user?.name;
export const isSuccess = (state) => state.userInfo.isSuccess;
export const isReady = (state) => state.userInfo.isReady;
export const loading = (state) => state.userInfo.loading;
export const message = (state) => state.userInfo.message;
export default authSlice.reducer;
