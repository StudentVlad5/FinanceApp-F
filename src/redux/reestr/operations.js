import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = '/reestr';

export const getReestr = createAsyncThunk('reestr/getAll', async (_, thunkAPI) => {
  try {
    const res = await axios.get(`${baseUrl}/get_all`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

export const createReestr = createAsyncThunk('reestr/create', async (groupData, thunkAPI) => {
  try {
    const res = await axios.post(`${baseUrl}/create`, groupData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

export const editReestr = createAsyncThunk('reestr/edit', async ({ id, data }, thunkAPI) => {
  try {
    const res = await axios.post(`${baseUrl}/edit/${id}`, data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});
