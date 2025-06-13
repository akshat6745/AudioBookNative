import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      // backgroundColor will be set dynamically
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
    //   paddingBottom: Platform.OS === "ios" ? 30 : 16, // Add extra padding at bottom for iOS
    paddingBottom: 16,
      elevation: 5,
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 999,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: "bold",
      // color will be set dynamically
    },
    closeBtn: {
      position: "absolute",
      right: 0,
      padding: 5,
    },
    controlsContainer: {
      marginTop: 8,
      marginBottom: 5,
    },
    settingsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 8,
    },
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      // backgroundColor will be set dynamically
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginHorizontal: 4,
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
    },
    buttonIcon: {
      marginRight: 4,
    },
    dropdownButtonText: {
      // color will be set dynamically
      marginRight: 2,
      fontSize: 12,
    },
    playerContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 10,
      padding: 4,
      marginHorizontal: 4,
    },
    controlButton: {
      backgroundColor: "#f0f0f0",
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
    },
    playButton: {
      // backgroundColor will be set dynamically
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 4,
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 1,
      elevation: 2,
    },
    disabledButton: {
      backgroundColor: "#e0e0e0",
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "80%",
      // backgroundColor will be set dynamically
      borderRadius: 12,
      padding: 20,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      // color will be set dynamically
      textAlign: "center",
      marginBottom: 15,
    },
    optionsContainer: {
      marginBottom: 15,
    },
    optionItem: {
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginBottom: 8,
      // ...Platform.select({
      //   ios: {
      //     minHeight: 44,
      //   },
      // }),
    },
    selectedOption: {
      // backgroundColor will be set dynamically
      // borderColor will be set dynamically
      borderWidth: 1,
    },
    optionText: {
      fontSize: 16,
      // color will be set dynamically
    },
    closeButton: {
      padding: 12,
      // backgroundColor will be set dynamically
      borderRadius: 8,
      alignItems: "center",
      // ...Platform.select({
      //   ios: {
      //     shadowColor: "#000",
      //     shadowOffset: { width: 0, height: 1 },
      //     shadowOpacity: 0.2,
      //     shadowRadius: 1.5,
      //     minHeight: 44,
      //   },
      // }),
    },
    closeButtonText: {
      fontSize: 16,
      // color will be set dynamically
      fontWeight: "bold",
    },
    loadingIndicator: {
      padding: 10,
      alignItems: "center",
    },
    errorContainer: {
      padding: 12,
      alignItems: "center",
      // backgroundColor will be set dynamically
      borderRadius: 8,
      margin: 10,
    },
    errorText: {
      // color will be set dynamically
      marginBottom: 8,
      fontSize: 15,
    },
    retryButton: {
      padding: 10,
      paddingHorizontal: 20,
      // backgroundColor will be set dynamically
      borderRadius: 6,
      // shadowColor will be set dynamically
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
    },
    retryText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 15,
    },
    chapterStatusContainer: {
      paddingVertical: 5,
      marginBottom: 8,
      alignItems: "center",
    },
    lastParagraphText: {
      // color will be set dynamically
      fontWeight: "bold",
      fontSize: 14,
    },
    optionsScrollView: {
      maxHeight: 250, // Adjust as needed for your design
    },
  });
  