import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create async thunk
export const leaderboardCall = createAsyncThunk(
  "leaderboardCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = "/api/leaderboard";
      const res = await axios.get(apiUrl);
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
  leaderboards: [],
};

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(leaderboardCall.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(leaderboardCall.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.leaderboards = action.payload;
    });
    builder.addCase(leaderboardCall.rejected, (state) => {
      state.loading = false;
      state.success = false;
      state.message = "An error occured";
    });
  },
});

export const loading = (state) => state?.topleaderboard?.loading;
export const leaderboards = (state) => state?.topleaderboard?.leaderboards;
export default leaderboardSlice.reducer;
