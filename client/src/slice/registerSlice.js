import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create async thunk
export const registerCall = createAsyncThunk(
  "registerCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = `/auth/register`;
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
  loading: false,
  success: false,
  error: "",
  message: "",
};

const registerSlice = createSlice({
  name: "regiser",
  initialState,
  reducers: {
    LOG_OUT(state, action) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("cartItems");
      window.location = "/";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(registerCall.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = "";
      state.message = "";
    });
    builder.addCase(registerCall.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.error = "";
      state.message = "Registration successful";
    });
    builder.addCase(registerCall.rejected, (state, { payload }) => {
      state.loading = false;
      state.success = false;
      state.error = payload?.data?.error || payload?.data?.message || "Registration failed";
      state.message = state.error;
    });
  },
});

export const loading = (state) => state?.register?.loading;
export const message = (state) => state?.register?.message;
export const error = (state) => state?.register?.error;
export const success = (state) => state?.register?.success;
export default registerSlice.reducer;
