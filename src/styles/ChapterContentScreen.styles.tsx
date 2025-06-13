import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      // backgroundColor will be set dynamically
    },
    contentContainer: {
      paddingBottom: 100, // Add padding to ensure content is not hidden behind the audio player
    },
    chapterTitleContainer: {
      marginBottom: 16,
    },
    chapterNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      // color will be set dynamically
    },
    chapterTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      // color will be set dynamically
      marginBottom: 4,
    },
    publishedTime: {
      fontSize: 16,
      // color will be set dynamically
      marginBottom: 16,
    },
    chapterTitleCard: {
      // backgroundColor will be set dynamically
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
      // borderColor will be set dynamically
      borderWidth: 1,
    },
    chapterTitleCardText: {
      fontSize: 16,
      fontWeight: '500',
      // color will be set dynamically
    },
    loadingNextChapter: {
      // color will be set dynamically
      textAlign: 'center',
      marginBottom: 10,
      fontWeight: 'bold',
    },
    paragraphItem: {
      // backgroundColor will be set dynamically
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 2,
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    activeParagraphItem: {
      // backgroundColor will be set dynamically
      // borderColor will be set dynamically
      borderWidth: 1,
    },
    paragraphText: {
      fontSize: 16,
      lineHeight: 24,
      // color will be set dynamically
    },
    activeParagraphText: {
      // color will be set dynamically
      fontWeight: '500',
    },
    footerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    floatingButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      // backgroundColor will be set dynamically
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
      zIndex: 98,
    },
    debugButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(50,50,50,0.85)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      zIndex: 99,
    },
    debugButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 4,
    },
  });