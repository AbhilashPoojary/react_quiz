import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create async thunk
export const insertScoreCall = createAsyncThunk(
  "insertScoreCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = "/api/score";
      const res = await axios.post(apiUrl, payload);
      return res.data;
    } catch (error) {
      if (error.response) {
        console.log(error);
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
  message: "",
  insertedScore: {},
};

const insertScoreSlice = createSlice({
  name: "allplayers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(insertScoreCall.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(insertScoreCall.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.insertedScore = action.payload;
    });
    builder.addCase(insertScoreCall.rejected, (state) => {
      state.loading = false;
      state.success = false;
      state.message = "An error occured";
    });
  },
});

export const loading = (state) => state?.insert?.loading;
export const insertedScore = (state) => state?.insert?.insertedScore;
export default insertScoreSlice.reducer;
