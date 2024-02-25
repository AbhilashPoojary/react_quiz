import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authSlice from "../slice/authSlice";
import registerSlice from "../slice/registerSlice";
import leaderboardSlice from "../slice/leaderboardSlice";
import allplayersSlice from "../slice/allplayersSlice";
import insertScoreSlice from "../slice/insertScoreSlice";

const rootReducer = combineReducers({
  userInfo: authSlice,
  register: registerSlice,
  topleaderboard: leaderboardSlice,
  players: allplayersSlice,
  insert: insertScoreSlice,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
