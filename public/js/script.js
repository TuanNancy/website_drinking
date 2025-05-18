// Hàm format tiền VNĐ
function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Biến toàn cục cho phân trang
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;
let allDrinks = [];

// Hàm chung để gọi API
async function fetchDrinks() {
  try {
    const response = await fetch("/api/drinks");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    allDrinks = await response.json();
    totalPages = Math.ceil(allDrinks.length / itemsPerPage);
    return allDrinks;
  } catch (error) {
    console.error("Error fetching drinks:", error);
    return [];
  }
}

// Hàm tìm kiếm và lọc đồ uống
function filterDrinks(searchQuery) {
  if (!searchQuery) return allDrinks;
  return allDrinks.filter((drink) =>
    drink.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

// Hàm hiển thị danh sách đồ uống với phân trang
async function displayDrinks() {
  const drinksList = document.getElementById("drinksList");
  if (!drinksList) return;

  const searchInput = document.getElementById("searchInput");
  const searchQuery = searchInput ? searchInput.value : "";

  const filteredDrinks = filterDrinks(searchQuery);
  totalPages = Math.ceil(filteredDrinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const drinksToShow = filteredDrinks.slice(startIndex, endIndex);

  // Cập nhật trạng thái nút phân trang
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
  document.getElementById(
    "pageInfo"
  ).textContent = `Page ${currentPage} of ${totalPages}`;

  drinksList.innerHTML = drinksToShow
    .map(
      (drink) => `
        <div class="drink-card" onclick="window.location.href='/detail?id=${
          drink._id
        }'" style="cursor: pointer;">
            <div class="drink-images">
                ${
                  drink.images && drink.images.length > 0
                    ? drink.images
                        .map(
                          (image) => `
                        <img src="${image}" alt="${drink.name}">
                    `
                        )
                        .join("")
                    : "<p>No images available</p>"
                }
            </div>
            <div class="drink-info">
                <h3>${drink.name}</h3>
                <p>Size: ${drink.size}</p>
                <p class="drink-price">${formatVND(drink.price)}</p>
                ${
                  drink.attributes && drink.attributes.length > 0
                    ? `<div class="drink-attributes">
                        ${drink.attributes
                          .map(
                            (attr) => `
                            <span class="attribute-tag">${attr.key}: ${attr.value}</span>
                        `
                          )
                          .join("")}
                       </div>`
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

// Hàm thêm đồ uống mới
async function setupAddDrinkForm() {
  const form = document.getElementById("addDrinkForm");
  if (!form) return;

  // Thêm attribute mới
  document.querySelector(".add-attr").addEventListener("click", () => {
    const container = document.getElementById("attributesContainer");
    const newAttr = document.createElement("div");
    newAttr.className = "attribute";
    newAttr.innerHTML = `
      <input type="text" placeholder="Key (e.g., ice)" class="attr-key">
      <input type="text" placeholder="Value (e.g., Normal)" class="attr-value">
      <button type="button" class="remove-attr">-</button>
    `;
    container.appendChild(newAttr);

    // Thêm sự kiện xóa attribute
    newAttr.querySelector(".remove-attr").addEventListener("click", () => {
      container.removeChild(newAttr);
    });
  });

  // Xử lý submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Lấy các attributes
    const attributes = [];
    document.querySelectorAll(".attribute").forEach((attrEl) => {
      const key = attrEl.querySelector(".attr-key").value;
      const value = attrEl.querySelector(".attr-value").value;
      if (key && value) {
        attributes.push({ key, value });
      }
    });

    const drinkData = {
      name: form.name.value,
      size: form.size.value,
      price: Number(form.price.value),
      attributes,
    };

    try {
      const response = await fetch("/api/drinks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(drinkData),
      });

      if (response.ok) {
        alert("Drink added successfully!");
        form.reset();
        document.getElementById("attributesContainer").innerHTML = "";
      } else {
        throw new Error("Failed to add drink");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding drink");
    }
  });
}

// Hàm cập nhật đồ uống
async function setupUpdateDrinkForm() {
  const drinksList = document.getElementById("updateDrinksList");
  const form = document.getElementById("updateDrinkForm");
  const attributesContainer = document.getElementById(
    "updateAttributesContainer"
  );

  if (!drinksList || !form) return;

  // Lấy danh sách sản phẩm
  const drinks = await fetchDrinks();

  // Hiển thị sản phẩm dạng card
  drinksList.innerHTML = drinks
    .map(
      (drink) => `
      <div class="drink-card">
        <div class="drink-images">
          ${
            drink.images && drink.images.length > 0
              ? drink.images
                  .map(
                    (image) =>
                      `<img src="${image}" alt="${drink.name}" style="width:80px;">`
                  )
                  .join("")
              : "<p>No images</p>"
          }
        </div>
        <div class="drink-info">
          <h3>${drink.name}</h3>
          <p>Size: ${drink.size}</p>
          <p class="drink-price">${drink.price} VND</p>
          <button class="update-btn" data-id="${
            drink._id
          }">Cập nhật sản phẩm</button>
        </div>
      </div>
    `
    )
    .join("");

  // Bắt sự kiện cho các nút cập nhật
  drinksList.querySelectorAll(".update-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const drinkId = btn.getAttribute("data-id");
      try {
        const response = await fetch(`/api/drinks/${drinkId}`);
        if (!response.ok) throw new Error("Drink not found");
        const drink = await response.json();

        // Điền dữ liệu vào form
        document.getElementById("updateId").value = drink._id;
        document.getElementById("updateName").value = drink.name;
        document.getElementById("updateSize").value = drink.size;
        document.getElementById("updatePrice").value = drink.price;

        // Điền attributes
        attributesContainer.innerHTML = "";
        (drink.attributes || []).forEach((attr) => {
          addAttributeField(attr.key, attr.value);
        });

        form.style.display = "block";
        form.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        alert("Error loading drink data");
      }
    });
  });

  // Thêm attribute field mới
  document.getElementById("addUpdateAttr").addEventListener("click", () => {
    addAttributeField("", "");
  });

  // Xử lý submit form (giữ nguyên như cũ)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const attributes = [];
    document.querySelectorAll(".update-attribute").forEach((attrEl) => {
      const key = attrEl.querySelector(".update-attr-key").value;
      const value = attrEl.querySelector(".update-attr-value").value;
      if (key && value) {
        attributes.push({ key, value });
      }
    });

    const drinkData = {
      name: form.updateName.value,
      size: form.updateSize.value,
      price: Number(form.updatePrice.value),
      attributes,
    };

    try {
      const response = await fetch(`/api/drinks/${form.updateId.value}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(drinkData),
      });

      if (response.ok) {
        alert("Drink updated successfully!");
        window.location.reload();
      } else {
        throw new Error("Failed to update drink");
      }
    } catch (error) {
      alert("Error updating drink");
    }
  });

  // Hàm helper để thêm attribute field
  function addAttributeField(key = "", value = "") {
    const attrDiv = document.createElement("div");
    attrDiv.className = "update-attribute";
    attrDiv.innerHTML = `
      <input type="text" placeholder="Key" class="update-attr-key" value="${key}">
      <input type="text" placeholder="Value" class="update-attr-value" value="${value}">
      <button type="button" class="remove-update-attr">-</button>
    `;
    attributesContainer.appendChild(attrDiv);

    attrDiv
      .querySelector(".remove-update-attr")
      .addEventListener("click", () => {
        attributesContainer.removeChild(attrDiv);
      });
  }
}

// Hàm xóa đồ uống
async function setupDeleteDrink() {
  const drinkSelect = document.getElementById("deleteDrinkSelect");
  const deleteBtn = document.getElementById("deleteDrinkBtn");
  const messageDiv = document.getElementById("deleteMessage");

  if (!drinkSelect || !deleteBtn) return;

  // Đổ dữ liệu vào dropdown
  const drinks = await fetchDrinks();
  drinks.forEach((drink) => {
    const option = document.createElement("option");
    option.value = drink._id;
    option.textContent = `${drink.name} (${drink.size}) - ${drink.price} VND`;
    drinkSelect.appendChild(option);
  });

  // Xử lý xóa
  deleteBtn.addEventListener("click", async () => {
    const drinkId = drinkSelect.value;
    if (!drinkId) return;

    if (!confirm("Are you sure you want to delete this drink?")) return;

    try {
      const response = await fetch(`/api/drinks/${drinkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        messageDiv.textContent = "Drink deleted successfully!";
        messageDiv.className = "message-success";

        // Làm mới dropdown
        drinkSelect.innerHTML = "";
        const updatedDrinks = await fetchDrinks();
        updatedDrinks.forEach((drink) => {
          const option = document.createElement("option");
          option.value = drink._id;
          option.textContent = `${drink.name} (${drink.size}) - ${drink.price} VND`;
          drinkSelect.appendChild(option);
        });
      } else {
        throw new Error("Failed to delete drink");
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error deleting drink";
      messageDiv.className = "message-error";
    }
  });
}

// Hàm xử lý trang chi tiết sản phẩm
async function displayDrinkDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const drinkId = urlParams.get("id");
  const drinkDetail = document.getElementById("drinkDetail");

  if (!drinkId || !drinkDetail) {
    if (drinkDetail) {
      drinkDetail.innerHTML = "<p>Sản phẩm không tồn tại</p>";
    }
    return;
  }

  try {
    const response = await fetch(`/api/drinks/${drinkId}`);
    if (!response.ok) throw new Error("Không tìm thấy sản phẩm");

    const drink = await response.json();

    drinkDetail.innerHTML = `
            <div class="drink-detail-header">
                <div class="drink-images">
                    ${
                      drink.images && drink.images.length > 0
                        ? drink.images
                            .map(
                              (image) => `
                            <img src="${image}" alt="${drink.name}">
                        `
                            )
                            .join("")
                        : "<p>Không có hình ảnh</p>"
                    }
                </div>
                <div class="drink-info">
                    <h1>${drink.name}</h1>
                    <p><strong>Kích thước:</strong> ${drink.size}</p>
                    <p class="drink-price">${formatVND(drink.price)}</p>
                    ${
                      drink.attributes && drink.attributes.length > 0
                        ? `<div class="drink-attributes">
                            <h3>Thông tin thêm:</h3>
                            ${drink.attributes
                              .map(
                                (attr) => `
                                <span class="attribute-tag">${attr.key}: ${attr.value}</span>
                            `
                              )
                              .join("")}
                           </div>`
                        : ""
                    }
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Error:", error);
    drinkDetail.innerHTML = "<p>Có lỗi xảy ra khi tải thông tin sản phẩm</p>";
  }
}

// Hàm chuyển trang
function changePage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  displayDrinks();
}

// Khởi tạo các chức năng khi trang được load
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1; // Reset về trang 1 khi tìm kiếm
      displayDrinks();
    });
  }

  // Kiểm tra xem đang ở trang nào để gọi hàm tương ứng
  if (document.getElementById("drinkDetail")) {
    displayDrinkDetail();
  } else {
    fetchDrinks().then(() => {
      displayDrinks();
    });
  }

  setupAddDrinkForm();
  setupUpdateDrinkForm();
  setupDeleteDrink();
});
