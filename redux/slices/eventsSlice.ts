import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchEventsFromFirebase } from "../../api/firebase/events/index";
import { Event } from "../../utils/types"; // Ensure correct import

// **Async Thunk to Fetch Events**
export const fetchEvents = createAsyncThunk<Event[], void>(
  "events/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const events = await fetchEventsFromFirebase();
      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      return rejectWithValue("Failed to fetch events.");
    }
  }
);

// **Initial State**
interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
};

// **Events Slice**
const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    addInterestedUser: (state, action: PayloadAction<string>) => {
      const event = state.events.find((e) => e.id === action.payload);
      if (event && event.interestedCount) {
        event.interestedCount += 1;
      }
    },
    incrementExternalClicks: (state, action: PayloadAction<string>) => {
      const event = state.events.find((e) => e.id === action.payload);
      if (event && event.externalClicks) {
        event.externalClicks += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        // Make coordinates serializable
        state.events = action.payload.map(event => ({
          ...event,
          coordinates: event.coordinates ? {
            latitude: Number(event.coordinates.latitude),
            longitude: Number(event.coordinates.longitude)
          } : undefined
        }));
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// **Export Actions & Reducer**
export const { addInterestedUser, incrementExternalClicks } = eventsSlice.actions;
export default eventsSlice.reducer;