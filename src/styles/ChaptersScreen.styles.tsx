import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    // color will be set dynamically
  },
  latestChapterContainer: {
    marginBottom: 24,
    borderRadius: 12,
    // backgroundColor will be set dynamically
    // shadowColor will be set dynamically
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
  },
  latestChapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor will be set dynamically
    padding: 12,
  },
  latestChapterHeaderText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  newTag: {
    backgroundColor: "#ff3b30",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newTagText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  latestChapterCard: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  latestChapterContent: {
    flex: 1,
  },
  chapterHeader: {
    fontSize: 18,
    fontWeight: "bold",
    // color will be set dynamically
  },
  latestChapterTitle: {
    fontSize: 16,
    // color will be set dynamically
    marginTop: 4,
  },
  chapterDate: {
    fontSize: 14,
    // color will be set dynamically
    marginTop: 4,
  },
  latestChapterAction: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  readNowText: {
    // color will be set dynamically
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  chapterListContainer: {
    // backgroundColor will be set dynamically
    borderRadius: 12,
    padding: 16,
    // shadowColor will be set dynamically
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterListHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  chapterListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    // color will be set dynamically
  },
  chapterCountBadge: {
    // backgroundColor will be set dynamically
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  chapterCountText: {
    // color will be set dynamically
    fontSize: 12,
    fontWeight: "500",
  },
  paginationInfo: {
    // backgroundColor will be set dynamically
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  paginationText: {
    // color will be set dynamically
    fontWeight: "500",
    textAlign: "center",
  },
  paginationControlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  paginationButton: {
    padding: 8,
    borderWidth: 1,
    // borderColor will be set dynamically
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationButtonDisabled: {
    // borderColor will be set dynamically
  },
  pageNumbersContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    flex: 1,
  },
  pageNumberButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor will be set dynamically
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  currentPageButton: {
    // backgroundColor will be set dynamically
  },
  pageNumberText: {
    // color will be set dynamically
    fontSize: 14,
    fontWeight: "500",
  },
  currentPageText: {
    color: "white",
  },
  ellipsis: {
    // color will be set dynamically
    marginHorizontal: 4,
  },
  resumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor will be set dynamically
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    // borderColor will be set dynamically
  },
  resumeText: {
    fontSize: 16,
    fontWeight: "bold",
    // color will be set dynamically
    marginLeft: 8,
  },
  chapterItem: {
    // backgroundColor will be set dynamically
    padding: 16,
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    // borderColor will be set dynamically
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterItemContent: {
    flex: 1,
  },
  chapterItemIcon: {
    marginLeft: 8,
  },
  lastReadChapterItem: {
    // backgroundColor will be set dynamically
    borderWidth: 1,
    // borderColor will be set dynamically
    borderLeftWidth: 4,
    // borderLeftColor will be set dynamically
  },
  chapterMainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    // color will be set dynamically
    marginBottom: 8,
  },
  chapterDetailNumber: {
    fontSize: 15,
    // color will be set dynamically
  },
  chapterDetailTitle: {
    fontSize: 15,
    // color will be set dynamically
  },
  chapterDetailDate: {
    fontSize: 14,
    // color will be set dynamically
    marginTop: 2,
  },
});
