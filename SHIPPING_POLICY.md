# Chính sách tính phí vận chuyển — VeloBike

## Tổng quan

Phí vận chuyển được tính tự động dựa trên **khoảng cách thực tế** giữa địa chỉ seller và địa chỉ buyer, kết hợp với **trọng lượng xe đạp**.

---

## 1. Cách tính khoảng cách

- Hệ thống geocode địa chỉ seller và buyer qua **OpenStreetMap Nominatim** (miễn phí, không cần API key)
- Tính khoảng cách đường chim bay bằng công thức **Haversine**
- Nhân hệ số **1.3** để ước tính khoảng cách đường bộ thực tế
- Nếu geocode thất bại → fallback về **500km** (ước tính)

---

## 2. Phí cơ bản theo khoảng cách

| Khoảng cách | Phí cơ bản | Ghi chú |
|---|---|---|
| ≤ 50 km | 25.000 đ | Nội thành / gần |
| 51 – 200 km | 45.000 đ | Liên tỉnh gần |
| 201 – 500 km | 70.000 đ | Liên tỉnh trung |
| 501 – 1.000 km | 95.000 đ | Liên tỉnh xa |
| > 1.000 km | 120.000 đ | Xuyên quốc gia |

---

## 3. Phụ phí trọng lượng

- **Miễn phí** cho 5 kg đầu tiên
- **+5.000 đ/kg** cho mỗi kg vượt quá 5 kg
- **+20.000 đ** phụ phí hàng cồng kềnh nếu xe nặng hơn **15 kg**

**Công thức:**
```
Phí trọng lượng = max(0, trọng_lượng - 5) × 5.000
Phụ phí cồng kềnh = 20.000 nếu trọng_lượng > 15 kg, ngược lại = 0
```

---

## 4. Tổng phí vận chuyển

```
Tổng = Phí cơ bản + Phí trọng lượng + Phụ phí cồng kềnh
```

---

## 5. Ví dụ tính phí

### Ví dụ 1: Nội thành HCM → HCM, xe 10 kg
- Khoảng cách: ~15 km
- Phí cơ bản: 25.000 đ
- Phí trọng lượng: (10 - 5) × 5.000 = 25.000 đ
- Phụ phí cồng kềnh: 0 đ
- **Tổng: 50.000 đ**

### Ví dụ 2: HCM → Hà Nội, xe 12 kg
- Khoảng cách: ~1.800 km (đường bộ ước tính)
- Phí cơ bản: 120.000 đ
- Phí trọng lượng: (12 - 5) × 5.000 = 35.000 đ
- Phụ phí cồng kềnh: 0 đ
- **Tổng: 155.000 đ**

### Ví dụ 3: Đà Nẵng → Hà Nội, xe 18 kg
- Khoảng cách: ~900 km (đường bộ ước tính)
- Phí cơ bản: 95.000 đ
- Phí trọng lượng: (18 - 5) × 5.000 = 65.000 đ
- Phụ phí cồng kềnh: 20.000 đ (> 15 kg)
- **Tổng: 180.000 đ**

---

## 6. Lưu ý

- Phí vận chuyển được tính tại thời điểm tạo đơn hàng và **không thay đổi** sau khi buyer thanh toán
- Nếu buyer cập nhật địa chỉ giao hàng trước khi thanh toán, phí sẽ được tính lại tự động
- Phí vận chuyển do **buyer thanh toán** và được giữ trong escrow cùng với giá xe
- Sau khi đơn hoàn tất, phí vận chuyển được **giữ lại bởi platform** (không chuyển cho seller)
- Trọng lượng xe lấy từ thông tin specs do seller khai báo khi đăng bài; mặc định **10 kg** nếu không có
