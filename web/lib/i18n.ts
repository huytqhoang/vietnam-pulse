export type Lang = "vi" | "en";

export const t = {
  // Nav
  title: { vi: "Nhịp Kinh Tế", en: "Economy Pulse" },
  subtitle: { vi: "Việt Nam · TP.HCM", en: "Vietnam · Ho Chi Minh City" },
  lastUpdated: { vi: "Cập nhật", en: "Updated" },

  // Squeeze levels
  squeezeTitle: { vi: "Áp Lực Kinh Tế", en: "Economic Pressure" },
  squeezeLow: { vi: "Thấp", en: "Low" },
  squeezeMedium: { vi: "Vừa", en: "Moderate" },
  squeezeHigh: { vi: "Cao", en: "High" },
  squeezeCritical: { vi: "Rất Cao", en: "Critical" },

  // Wallet section
  walletTitle: { vi: "Ví Của Bạn", en: "Your Wallet" },
  walletDesc: {
    vi: "Những con số bạn cảm thấy mỗi ngày",
    en: "Numbers you feel every day",
  },
  usdVnd: { vi: "Tỷ giá USD/VND", en: "USD/VND Rate" },
  usdVndDesc: {
    vi: "Hàng nhập khẩu, điện thoại, xăng đều theo đây",
    en: "Imported goods, phones, fuel follow this",
  },
  goldPrice: { vi: "Giá Vàng SJC", en: "SJC Gold Price" },
  goldDesc: {
    vi: "Người Việt mua vàng khi lo lắng — thước đo niềm tin",
    en: "Vietnamese buy gold when anxious — trust barometer",
  },
  vnIndex: { vi: "VN-Index", en: "VN-Index" },
  vnIndexDesc: {
    vi: "Tâm lý nhà đầu tư, kỳ vọng kinh tế",
    en: "Investor sentiment, economic expectations",
  },

  // Big picture
  bigTitle: { vi: "Bức Tranh Lớn", en: "Big Picture" },
  bigDesc: {
    vi: "Số liệu chính thức — nền tảng của câu chuyện",
    en: "Official figures — the foundation of the story",
  },
  cpiLabel: { vi: "Lạm Phát (CPI)", en: "Inflation (CPI)" },
  cpiDesc: { vi: "Giá cả tăng bao nhiêu mỗi năm", en: "How fast prices rise annually" },
  gdpLabel: { vi: "Tăng Trưởng GDP", en: "GDP Growth" },
  gdpDesc: { vi: "Kinh tế tăng trưởng trên giấy tờ", en: "Economy growing on paper" },
  fdiLabel: { vi: "Vốn Nước Ngoài (FDI)", en: "Foreign Investment (FDI)" },
  fdiDesc: { vi: "Nhà đầu tư nước ngoài tin tưởng Việt Nam?", en: "Do foreign investors trust Vietnam?" },

  // Story section
  storyTitle: { vi: "Câu Chuyện Đằng Sau", en: "The Story Behind" },
  storySqueezeTitle: { vi: "Gọng Kìm Hai Đầu", en: "Squeezed from Both Sides" },
  storyExternalTitle: { vi: "Áp Lực Từ Bên Ngoài", en: "External Pressure" },
  storyExternalText: {
    vi: "Mỹ áp thuế 46% lên hàng Việt Nam năm 2025. Nhà máy lo lắng. Đơn hàng xuất khẩu giảm. VN-Index phản ánh điều này.",
    en: "The US imposed 46% tariffs on Vietnamese goods in 2025. Factories are worried. Export orders falling. The VN-Index reflects this.",
  },
  storyInternalTitle: { vi: "Áp Lực Từ Bên Trong", en: "Internal Pressure" },
  storyInternalText: {
    vi: "Vụ Vạn Thịnh Phát đóng băng thị trường trái phiếu doanh nghiệp. Bất động sản chưa phục hồi. Người tiêu dùng thận trọng hơn.",
    en: "The Van Thinh Phat scandal froze the corporate bond market. Real estate hasn't recovered. Consumers are more cautious.",
  },
  storyImplication: {
    vi: "GDP tăng 8% nhưng bạn — người lái Grab, tiệm tạp hóa, quán ăn — cảm nhận thực tế khác.",
    en: "GDP grows 8% but you — the Grab driver, the convenience store, the food stall — feel a different reality.",
  },

  // Footer
  footerNote: {
    vi: "Dữ liệu từ Vietcombank, DOJI, VCI, World Bank. Cập nhật tự động mỗi ngày.",
    en: "Data from Vietcombank, DOJI, VCI, World Bank. Auto-updated daily.",
  },

  // Misc
  noData: { vi: "Chưa có dữ liệu", en: "No data" },
  perLuong: { vi: "/lượng", en: "/tael" },
  pts: { vi: "điểm", en: "pts" },
  annual: { vi: "mỗi năm", en: "per year" },
  ofGdp: { vi: "% GDP", en: "% of GDP" },
  changeVsLastWeek: { vi: "so tuần trước", en: "vs last week" },
};

export function tr(key: keyof typeof t, lang: Lang): string {
  return t[key]?.[lang] ?? key;
}
