import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  novelItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  novelInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  novelAuthor: {
    fontSize: 14,
    marginBottom: 2,
  },
  novelChapters: {
    fontSize: 12,
    marginBottom: 2,
  },
  novelSource: {
    fontSize: 12,
    fontStyle: "italic",
  },
  resumeButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  resumeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  uploadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
