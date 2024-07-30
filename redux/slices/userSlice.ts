import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

interface UserState {
    user: any,
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: null,
    loading: false,
    error: null
}

export const signIn = createAsyncThunk(
    'user/signIn',
    async ({ email, password }: { email: string; password: string }) => {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    }
  );
  
export const signUp = createAsyncThunk(
'user/signUp',
async ({ email, password }: { email: string; password: string }) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}
);
  
export const signInAnonymous = createAsyncThunk('user/signInAnonymously', async () => {
const auth = getAuth();
const userCredential = await signInAnonymously(auth);
return userCredential.user;
});
  
const userSlice = createSlice({
name: 'user',
initialState,
reducers: {
    signOut: (state) => {
    state.user = null;
    },
},
extraReducers: (builder) => {
    builder
    .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
    })
    .addCase(signIn.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign in';
        state.loading = false;
    })
    .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
    })
    .addCase(signUp.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign up';
        state.loading = false;
    })
    .addCase(signInAnonymous.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(signInAnonymous.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
    })
    .addCase(signInAnonymous.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign in anonymously';
        state.loading = false;
    });
},
});

export const { signOut } = userSlice.actions;

export default userSlice.reducer;