import { createSlice } from '@reduxjs/toolkit';
import { createReestr, getReestr, editReestr } from './operations';

const initialState = {
  items: [],
  selected: null,
  isLoading: false,
  error: null,
};

export const reestrSlice = createSlice({
  name: 'reestr',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get All
      .addCase(getReestr.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReestr.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data ?? action.payload;
      })
      .addCase(getReestr.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createReestr.fulfilled, (state, action) => {
        state.items.push(action.payload.data ?? action.payload);
      })
      // Edit
      .addCase(editReestr.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export const reestrReducer = reestrSlice.reducer;
