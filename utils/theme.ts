// theme.ts
import { StyleSheet } from 'react-native';

export const lightTheme = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#4D6561',
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchIconContainer: {
    paddingLeft: 10
  },
  searchInput: {
    color: 'black',
    fontSize: 18,
    height: 40,
    fontFamily: 'Outfit_400Regular',
  },
});

export const darkTheme = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1E1E1E',
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchIconContainer: {
    paddingLeft: 10
  },
  searchInput: {
    color: '#FFF',
    fontSize: 18,
    height: 40,
    fontFamily: 'Outfit_400Regular',
  }
});
