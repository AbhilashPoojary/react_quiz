import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//create async thunk
export const allplayersCall = createAsyncThunk(
  "allplayersCall",
  async (payload, { rejectWithValue }) => {
    try {
      const apiUrl = "/api/search";
      console.log(payload);
      const res = await axios.post(apiUrl, payload);
      console.log(res.data);
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
  allplayers: [],
};

const allplayersSlice = createSlice({
  name: "allplayers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allplayersCall.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(allplayersCall.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.allplayers = action.payload;
    });
    builder.addCase(allplayersCall.rejected, (state) => {
      state.loading = false;
      state.success = false;
      state.message = "An error occured";
    });
  },
});

export const loading = (state) => state?.players?.loading;
export const allplayers = (state) => state?.players?.allplayers;
export default allplayersSlice.reducer;
