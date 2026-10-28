# WorldBox Simulator - God Sandbox 🌍👑

Một trò chơi mô phỏng thế giới pixel art 2D lấy cảm hứng từ WorldBox, xây dựng bằng React 19, TypeScript và Vite Canvas. Người chơi đóng vai trò Đấng Sáng Thế (God Sandbox), tạo lập lục địa, gieo mầm sự sống, nuôi dưỡng các vương quốc hoặc tạo ra các thảm họa thiên nhiên.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

- **Chi Tiết Mô Hình Pixel Art Công Trình (WorldBox-inspired Pixel Art):**
  - **Tòa Thị Chính / Lâu Đài (Town Hall & Citadel):** Mái tím/đỏ hoàng gia nhiều tầng, tường đá kiên cố, tháp canh cờ hiệu theo màu vương quốc.
  - **Cối Xay Gió & Nông Trại Tròn (Windmill & Circular Wheat Farmland):** Cánh quạt quay liên tục, tự động cày xới và phát triển cánh đồng lúa mì vàng óng hình tròn xung quanh theo thời gian thực.
  - **Nhà Dân, Kho Lương, Doanh Trại & Bến Cảng:** Được phóng to kích thước tỷ lệ chuẩn (2.8x) so với nhân vật, chi tiết bóng đổ và dây leo rêu phong.
  - **Mở rộng giới hạn nhà cửa:** Tăng sức chứa dân cư và số lượng công trình tối đa của mỗi ngôi làng.

- **Thuyền Buồm Châu Âu Kiểu Carrack (European Carrack Flagship):**
  - Thân tàu gỗ nhiều tầng boong (forecastle & aftcastle) vững chắc.
  - Ba cột buồm với cánh buồm vuông và buồm tam giác lớn thêu quốc huy/màu cờ vương quốc.
  - **Hệ thống dẫn đường thông minh:** Thuyền chỉ di chuyển trên các ô nước (nước nông & nước sâu), hoàn toàn không thể đi trên cạn; cập bến neo đậu chính xác tại bờ biển hoặc bến cảng.

- **4 Chủng Tộc & Xã Hội Văn Minh:**
  - **Con người (Humans), Yêu tinh (Elves), Người lùn (Dwarves), Orc (Orcs).**
  - Mỗi chủng tộc có chỉ số, đặc tính và kiến trúc đặc trưng.
  - Cơ chế thành lập làng, kế vị trưởng làng (hereditary succession), đảo chính (coups), liên minh ngoại giao và chiến tranh lãnh thổ.
  - Tỉ lệ chiêu mộ dân số 80% khi sinh ra hoặc xuất hiện gần làng cùng chủng tộc.

- **Cân Bằng Sinh Thái Động Vật:**
  - Điều chỉnh giảm số lượng dã thú (chó sói, gấu...) xuống mức cân bằng tự nhiên, tránh tàn sát dân làng quá sớm.
  - Hệ sinh vật đa dạng: Cừu, bò, gà, sói, quái vật.

- **Quyền Năng Thần Thánh (God Powers):**
  - **Tạo sinh & Địa hình:** Đất sét, đồng cỏ, cát, nước nông, đại dương sâu thẳm, rừng rậm.
  - **Sinh mạng:** Sinh ra người, yêu tinh, quái vật, động vật.
  - **Thiên tai & Phép thuật:** Thiên thạch (Meteor), sấm sét (Lightning), bom nguyên tử (Nuke), mưa tạo ẩm, lửa thiêu rụi, huyết thanh hồi máu (Blessing/Heal).
  - **Luật Thế Giới (World Laws):** Bật/tắt đói khát, tuổi thọ, chiến tranh, hòa bình vĩnh cửu.

- **Âm Thanh & Tương Tác Sống Động:**
  - Hiệu ứng âm thanh procedural (Web Audio API) cho tiếng chặt cây, xây dựng, còi thuyền buồm, sấm sét, thiên thạch va chạm.
  - Camera phóng to/thu nhỏ mượt mà, kéo thả lia bản đồ, bảng theo dõi cá nhân (Inspector) chi tiết chỉ số từng sinh vật và vương quốc.

---

## 🚀 Cài Đặt & Chạy Thử (Quick Start)

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn / bun

### Hướng dẫn

```bash
# 1. Clone repository
git clone https://github.com/thinhprovc202-pixel/worldbox-test-zm.git
cd worldbox-test-zm

# 2. Cài đặt thư viện dependencies
npm install

# 3. Khởi chạy môi trường phát triển (Development)
npm run dev

# Mở trình duyệt và truy cập: http://localhost:3000
```

### Build Sản Phẩm (Production)

```bash
npm run build
npm run preview
```

### Chạy Kiểm Thử (Unit Tests)

```bash
npx tsx --test src/game/simulation.test.ts
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Framework:** React 19, TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4
- **Graphics:** HTML5 Canvas với pixel-art renderer hiệu năng cao
- **Audio:** Web Audio API (procedural sound synthesis)
- **Icons:** Lucide React

---

## 📜 Giấy Phép (License)

Dự án được phát triển cho mục đích học tập và giải trí mô phỏng thế giới sandbox.
