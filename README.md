# Mental Math V1.0

Mental Math là ứng dụng web luyện tính nhẩm dành cho người lớn. Ứng dụng dùng HTML, CSS và JavaScript ES Modules, chạy từ máy chủ tĩnh và lưu dữ liệu bằng LocalStorage. Giao diện tiếng Việt, nền tối, hỗ trợ bàn phím và màn hình nhỏ.

## Chạy trên máy

Mở terminal tại thư mục `Mental Math`, nơi có `index.html`, rồi chạy một trong các lệnh sau.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Trên Windows có thể dùng `py -m http.server 8000 --bind 127.0.0.1` nếu Python được cung cấp qua `py`. Mở [ứng dụng tại localhost](http://localhost:8000/) và nhấn Ctrl+C trong terminal khi muốn tắt server.

Với VS Code, mở thư mục `Mental Math`, cài tiện ích Live Server nếu chưa có, rồi chọn **Open with Live Server** trên `index.html`. Dùng địa chỉ tiện ích mở trong trình duyệt. ES Modules và Service Worker cần HTTP trên loopback hoặc HTTPS khi xuất bản.

## Luyện tập

| Level | Nội dung và cấu hình |
| --- | --- |
| 1 · Basic Arithmetic | Cộng, trừ, nhân, chia nguyên. Chọn phép toán, giới hạn toán hạng và cho phép kết quả âm khi trừ. |
| 1.1 · Mixed Arithmetic | Biểu thức số nguyên tôn trọng thứ tự ưu tiên. Chọn giới hạn, số toán hạng và cho phép kết quả âm. |
| 2 · Percentage & Decimal | Phần trăm của một số, tìm tỷ lệ, tăng giảm theo phần trăm và bốn phép tính thập phân. Chọn nhóm, giới hạn, số chữ số sau dấu thập phân của dữ kiện và độ khó. |
| 3 · Square & Square Root | Bình phương và căn bậc hai của số chính phương. Chọn dạng bài và giới hạn cơ số hoặc kết quả căn. |
| 3.1 · Comprehensive Arithmetic | Chọn nhóm và độ khó. **Random Questions** lấy từng câu từ các Level trước. **Mixed Expressions** phối hợp các nhóm đã chọn trong một biểu thức. |

1. Chọn Level và các tham số. Có thể bật đếm ngược mỗi câu, đặt giới hạn thử thách cho cả phiên và chỉnh thời gian hiện phản hồi.
2. Nhấn **Bắt đầu**. Nhập đáp án và nhấn Enter hoặc **Kiểm tra**. Chấp nhận dấu chấm hoặc dấu phẩy thập phân. Nút **±** đổi dấu khi bàn phím điện thoại cần hỗ trợ nhập số âm.
3. Dùng **Bỏ qua**, **Tạm dừng**, **Tiếp tục** hoặc **Kết thúc**. Câu mới tự xuất hiện sau phản hồi. Sau khi kết thúc, xem tổng kết hoặc nhấn **Bắt đầu lại**.
4. Mở **Lịch sử** để xem cấu hình, kết quả và từng câu, hoặc lọc riêng câu sai. Mở **Thống kê** để xem các chỉ số và bốn biểu đồ, có thể lọc theo Level.

Độ chính xác chia số câu đúng cho tổng số câu đã hoàn thành, gồm cả câu bỏ qua và hết giờ. Thời gian trả lời trung bình, nhanh nhất và chậm nhất chỉ tính câu đã gửi đáp án. Trung bình lịch sử tính trên từng câu đã gửi. Chuỗi tốt nhất của lịch sử là chuỗi cao nhất trong một phiên.

Timer mỗi câu và timer thử thách có deadline riêng. Tạm dừng ẩn câu hỏi và đóng băng cả hai. Phản hồi dùng thời gian của phiên nhưng được loại khỏi thời gian của câu tiếp theo. Khi chạm deadline trước hoặc cùng lúc gửi đáp án, câu hiện hành được ghi hết giờ một lần. Khi kết thúc thủ công, câu đang mở chưa đến deadline được bỏ khỏi tổng kết.

## Lịch sử và ngoại tuyến

Lịch sử giữ tối đa 30 phiên hoàn thành gần nhất có ít nhất một câu đã ghi kết quả. Cấu hình hợp lệ gần nhất và lịch sử còn sau khi tải lại. Hãy bấm **Kết thúc** để lưu trước khi rời trang. Phiên đang chạy nằm trong bộ nhớ của trang và có thể mất khi tải lại hoặc khi hệ điều hành đóng trình duyệt đột ngột. Ứng dụng yêu cầu xác nhận rời trang khi trình duyệt hỗ trợ. Nếu ghi lịch sử thất bại, ứng dụng báo lỗi và giữ phiên trong bộ nhớ để thử lưu lại từ tab **Lịch sử** trước khi đóng trang. Dữ liệu hỏng hoặc có phiên bản chưa hỗ trợ được báo rõ và lịch sử gốc được giữ cho đến khi người dùng chủ động xóa.

Khi Service Worker đã tải và kích hoạt thành công, có thể mở lại ứng dụng và luyện tập ngoại tuyến trên cùng trình duyệt. Lịch sử thuộc trình duyệt và origin hiện tại. Đổi thiết bị, địa chỉ, cổng hoặc xóa dữ liệu website có thể khiến dữ liệu cũ không xuất hiện. Ứng dụng không gửi đáp án hoặc thống kê ra máy chủ.

Trên iPhone, mở URL HTTPS của ứng dụng bằng Safari. Mở menu **Chia sẻ**, chọn **Thêm vào MH chính** hoặc **Add to Home Screen**, bật **Mở dưới dạng ứng dụng web** nếu Safari hiển thị tùy chọn, rồi chọn **Thêm**. Mở ứng dụng từ biểu tượng khi đang có mạng một lần để trình duyệt tải bộ nhớ đệm. Sau đó thử mở lại ở chế độ máy bay để kiểm tra.

## Deploy GitHub Pages

1. Tạo repository trống tên `MentalMath` trên GitHub. Với GitHub Free, chọn repository công khai để dùng Pages miễn phí.
2. Trong thư mục `Mental Math`, chạy các lệnh dưới đây. Thay `USERNAME` bằng tên tài khoản và dùng đúng tên repository vừa tạo.

```powershell
git init -b main
git add .
git commit -m "Release Mental Math V1.0"
git remote add origin https://github.com/USERNAME/MentalMath.git
git push -u origin main
```

3. Mở repository và vào **Settings → Pages**. Chọn **Deploy from a branch**, nhánh **main**, thư mục **/(root)**, rồi nhấn **Save**.
4. Sau khi workflow Pages thành công, mở URL được ghi trong **Settings → Pages**, ví dụ `https://USERNAME.github.io/MentalMath/`. File `.nojekyll` bật phục vụ nguyên trạng các tệp tĩnh. Các tài nguyên sử dụng đường dẫn tương đối.

Khi cập nhật, sửa mã, cập nhật danh sách tệp và tăng hậu tố phiên bản cache trong `sw.js` nếu mã hoặc tài nguyên ứng dụng thay đổi. Chạy kiểm thử, commit và push lên nhánh đã chọn. Mở lại trang sau khi Pages xuất bản và Service Worker mới kích hoạt. Worker mới tự dọn cache cũ của đúng ứng dụng trong cùng scope. [Tài liệu cấu hình GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Kiến trúc và các file bàn giao

| Vị trí | File và trách nhiệm |
| --- | --- |
| Thư mục gốc | `index.html` dựng ba tab. `manifest.json`, `sw.js` và `.nojekyll` hỗ trợ cài PWA, offline và Pages. `README.md` hướng dẫn sử dụng. `AGENTS.md` hướng dẫn bảo trì. |
| `css/` | `style.css` là bố cục, màu sắc và typography nền. `components.css` là các thành phần. `responsive.css` là các breakpoint. |
| `js/` | `app.js` nối các module và sự kiện trình duyệt. `config.js` giữ giới hạn, mặc định và hằng số. |
| `js/core/` | `practice-engine.js` điều phối trạng thái, deadline và phản hồi. `question-engine.js` gọi Level, giảm trùng và chấm đáp án. `session-manager.js` ghi kết quả phiên. `timer.js` đo thời gian hoạt động. `level-registry.js` quản lý Level. `expression-evaluator.js` tính biểu thức. `answer-validator.js` chuẩn hóa và so sánh đáp án. |
| `js/levels/` | `index.js` đăng ký Level. `level-helpers.js` tạo contract và chuẩn hóa câu hỏi. Các thuật toán nằm trong `level-1.js`, `level-1-1.js`, `level-2.js`, `level-3.js`, `level-3-1.js`. |
| `js/services/` | `storage-service.js` đọc và ghi JSON theo schema. `statistics-service.js` tính chỉ số phiên và lịch sử. |
| `js/ui/` | `settings-ui.js` sinh cấu hình. `practice-ui.js` hiển thị luyện tập. `history-ui.js` xem phiên và câu. `statistics-ui.js` lọc thống kê. `chart-ui.js` vẽ SVG. `metrics-ui.js` hiển thị chỉ số. `dom.js` chứa tiện ích DOM. |
| `js/utils/` | `math-utils.js` làm việc với phân số BigInt và số thập phân. `random-utils.js` tạo số ngẫu nhiên và ID. `format-utils.js` định dạng tiếng Việt. `validation-utils.js` kiểm tra cấu hình. |
| `assets/icons/` | `icon.svg`, `icon-192.png`, `icon-512.png` và `apple-touch-icon.png`. |
| `tests/` | `test-runner.html`, `browser-runner.js`, `run.mjs`, `suite.js` và `harness.js` chạy bộ test. `expression-evaluator.test.js`, `question-generator.test.js`, `answer-validator.test.js`, `timer.test.js`, `session-manager.test.js`, `storage-service.test.js` chứa ca kiểm thử. `browser-smoke.mjs` kiểm thử Chromium end-to-end. |

UI đọc tham số từ Settings Schema rồi gửi cấu hình tới Practice Engine. Engine yêu cầu Question Engine gọi Level đã đăng ký và mở câu với đồng hồ mới. Một lần Submit, Skip hoặc Timeout hợp lệ làm câu chuyển sang phản hồi, ghi một kết quả trong Session Manager và làm mới thống kê. Khi kết thúc, Storage Service lưu phiên. History và Statistics đọc toàn bộ dữ liệu từ cùng nguồn lưu.

Evaluator dùng hai stack chứa giá trị và toán tử. Toán tử cùng độ ưu tiên được rút gọn từ trái sang phải và ngoặc có phạm vi riêng. Phân số BigInt biểu diễn giá trị chính xác và giữ ký hiệu hiển thị tách khỏi phép tính, nên Level tổng hợp dùng lại token từ các Level trước.

## Thêm Level mới

1. Tạo file `js/levels/level-N.js`. Export đối tượng gồm `id`, `name`, `description`, `getDefaultSettings()`, `getSettingsSchema()`, `validateSettings(settings)` và `generateQuestion(settings, rng)`. Có thể dùng `defineLevel` để tạo contract từ schema và mặc định.
2. Hỗ trợ các kiểu trường có sẵn gồm `select`, `multi`, `checkbox`, `integer` và `range`. Đặt mặc định thỏa validation và dùng RNG được truyền vào để test tái lập được.
3. Trả về `{ expression, correctAnswer, answerType, metadata }`. Question Engine thêm `id` và `levelId`. `correctAnswer` là chuỗi và `metadata` phải tuần tự hóa được sang JSON. Có thể cung cấp `validateAnswer(input, question, settings)` trả về `{ valid, correct, input }` hoặc `{ valid: false, message }` nếu dạng bài cần quy tắc riêng.
4. Import và đăng ký trong `js/levels/index.js`, thêm file Level vào danh sách cache của `sw.js`, tăng phiên bản cache và thêm bảng ca kiểm thử. Registry tự đưa Level vào Practice, History và bộ lọc Statistics.

## Chạy kiểm thử

- Mở [trình chạy test trên trình duyệt](http://localhost:8000/tests/test-runner.html) với server local đang chạy. Trang liệt kê tất cả bài đã qua hoặc lỗi.
- Chạy `node tests/run.mjs` với Node.js 24 trở lên để chạy cùng bộ unit test từ terminal.
- Chạy `node tests/browser-smoke.mjs` với Node.js 24 trở lên và trình duyệt Chromium. Kiểm thử sử dụng hồ sơ trình duyệt tạm và server loopback tự chọn cổng. Có thể đặt biến môi trường `MENTAL_MATH_BROWSER` thành đường dẫn tới Chrome, Edge hoặc Chromium nếu công cụ không tìm thấy bản cài.

## Giới hạn V1.0

- Giới hạn toán hạng, cơ số hoặc kết quả căn từ 1 đến 99.999. Level 1.1 có 3–10 toán hạng. Giá trị trung gian ở Level số nguyên phải nằm trong phạm vi an toàn của JavaScript. Evaluator giới hạn 128 token, 16 lớp ngoặc và phân số tối đa 256 bit cho mỗi phần.
- Level 2 hỗ trợ 0–4 chữ số thập phân tối đa cho dữ kiện. Độ khó có thể tạo dữ kiện ngắn hơn. Kết quả chính xác có thể cần nhiều chữ số hơn dữ kiện. Các Level V1.0 sinh đáp án thập phân hữu hạn. Nếu Level mới dùng quy tắc làm tròn, cấu hình `metadata.rounding` để giao diện hiện số chữ số yêu cầu.
- Timer mỗi câu từ 1 đến 3.600 giây, timer thử thách tối đa 86.400 giây, thời gian phản hồi từ 0 đến 5.000 ms. Đáp án nhập tối đa 64 ký tự. Bộ sinh thử tối đa 80 lần để tạo biểu thức hợp lệ và thử tối đa 20 lần để giảm lặp, nên cấu hình có ít tổ hợp vẫn có thể gặp lại câu.
- Dung lượng LocalStorage và khả năng giữ cache phụ thuộc trình duyệt. Phiên rất dài có thể đầy dung lượng dù chưa đạt 30 phiên. Trình duyệt hoặc hệ điều hành quyết định việc hiển thị bàn phím ảo khi ứng dụng tự focus.

Các hướng mở rộng sau V1.0 gồm bộ đề phân số/lũy thừa theo cùng contract, khôi phục phiên dang dở, xuất/nhập lịch sử và kiểm thử trên Safari iPhone thật.
