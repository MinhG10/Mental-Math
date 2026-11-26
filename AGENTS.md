# Hướng dẫn phát triển Mental Math

## Mục tiêu

Duy trì ứng dụng tĩnh luyện tính nhẩm cho người lớn. Giữ giao diện tiếng Việt, dark mode, thao tác bàn phím, responsive, PWA ngoại tuyến và khả năng chạy trực tiếp từ thư mục con trên GitHub Pages.

## Kiến trúc và quy ước

- Dùng HTML, CSS và JavaScript ES Modules với đường dẫn tương đối. Dùng `const` mặc định, `let` khi cần gán lại và tên định danh tiếng Anh. Giữ thông báo người dùng bằng tiếng Việt.
- `js/core/` giữ trạng thái luyện tập, đánh giá đáp án, đồng hồ và registry. Phép tính chỉ nằm trong evaluator, các Level và tiện ích toán học. Dùng token và phân số chính xác cho số thập phân, tuyệt đối tránh thực thi biểu thức dưới dạng mã JavaScript.
- `js/services/` giữ logic lưu và thống kê. `js/ui/` nhận tương tác, sinh trường từ schema, hiển thị dữ liệu và phản hồi. `js/app.js` nối các thành phần và sự kiện vòng đời trang.
- Mỗi câu có một ID và tối đa một kết quả. Mọi đường Submit và Skip phải kiểm tra deadline trước khi ghi. Pause đóng băng timer phiên và timer câu, giữ ẩn biểu thức. Thời gian phản hồi nằm ngoài thời gian trả lời của câu tiếp theo.
- Giữ các tính năng và hành vi đã hoạt động khi mở rộng dự án. Chỉ thay đổi kiến trúc cốt lõi khi có lý do kỹ thuật rõ ràng và ghi lại phạm vi ảnh hưởng.

## Thêm Level

- Tạo module trong `js/levels/`, cung cấp thông tin Level, mặc định, Settings Schema, validation và generator. Dùng RNG được truyền vào và tái sử dụng evaluator cùng tiện ích đang có.
- Trả về câu hỏi gồm `expression`, `correctAnswer`, `answerType`, `metadata`. Giữ metadata là dữ liệu JSON. Nếu cần cú pháp đáp án riêng, bổ sung `validateAnswer` theo contract trong README.
- Đăng ký trong `js/levels/index.js`. UI, History và Statistics lấy danh sách từ registry. Bổ sung tài nguyên mới vào `sw.js` và viết test theo biên, độ khó và nhóm phép toán.

## Lưu trữ và phát hành

- Lưu cấu hình và tối đa 30 phiên trong các khóa JSON versioned của Storage Service. Giữ ID Level và cấu trúc bản ghi ổn định để đọc lại phiên cũ.
- Khi đổi schema, bổ sung migration có test cho dữ liệu cũ, dữ liệu lỗi và phiên bản chưa hỗ trợ. Chỉ ghi dữ liệu sau khi xác thực và chuyển đổi thành công. Báo lỗi lưu rõ ràng và giữ phiên chưa lưu để có thể thử lại trong trang.
- Khi thay đổi tài nguyên runtime, cập nhật danh sách precache và tăng phiên bản cache trong `sw.js`. Chỉ dọn cache theo prefix của scope hiện tại. Giữ URL tương đối và cập nhật số phiên bản hiển thị, tài liệu và ghi chú phát hành khi cần.

## Kiểm thử

- Sau mỗi chỉnh sửa, chạy `node tests/run.mjs` hoặc mở `tests/test-runner.html` từ server tĩnh. Với thay đổi UI, lưu trữ hoặc PWA, chạy thêm `node tests/browser-smoke.mjs`.
- Kiểm tra tính đúng của phép toán, giới hạn, luồng phím Enter, cạnh deadline, Pause/Resume, dữ liệu sau reload và khả năng chạy offline từ đường dẫn con. Ghi rõ môi trường, kết quả và phần chưa xác minh khi bàn giao.
