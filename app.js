const products = [
  {
    id: "paracetamol-500",
    name: "Paracetamol 500 mg",
    category: "Dolor y fiebre",
    description: "Caja con tabletas para alivio temporal de dolor y fiebre.",
    price: 48,
    stock: 28,
    prescription: false,
    colors: ["#143ee8", "#e8edff"],
  },
  {
    id: "ibuprofeno-400",
    name: "Ibuprofeno 400 mg",
    category: "Dolor y fiebre",
    description: "Antiinflamatorio de venta comun. Confirmar indicaciones antes de comprar.",
    price: 72,
    stock: 16,
    prescription: false,
    colors: ["#f92d93", "#ffe1f0"],
  },
  {
    id: "loratadina-10",
    name: "Loratadina 10 mg",
    category: "Alergias",
    description: "Antihistaminico para molestias estacionales y rinitis alergica.",
    price: 64,
    stock: 22,
    prescription: false,
    colors: ["#22c7b8", "#d8fff9"],
  },
  {
    id: "ambroxol-jarabe",
    name: "Ambroxol jarabe",
    category: "Respiratorio",
    description: "Jarabe expectorante para apoyo respiratorio de uso familiar.",
    price: 93,
    stock: 12,
    prescription: false,
    colors: ["#ef0b36", "#ffd8e0"],
  },
  {
    id: "vitamina-c",
    name: "Vitamina C",
    category: "Vitaminas",
    description: "Suplemento diario con tabletas efervescentes sabor naranja.",
    price: 118,
    stock: 34,
    prescription: false,
    colors: ["#ffb000", "#fff0c2"],
  },
  {
    id: "suero-oral",
    name: "Suero oral",
    category: "Hidratacion",
    description: "Sobres para preparar solucion de rehidratacion oral.",
    price: 36,
    stock: 40,
    prescription: false,
    colors: ["#0a7bff", "#dcecff"],
  },
  {
    id: "curitas-kit",
    name: "Kit de curacion",
    category: "Primeros auxilios",
    description: "Gasas, vendas y apositos para cuidado basico en casa.",
    price: 149,
    stock: 18,
    prescription: false,
    colors: ["#f92d93", "#ffe1f0"],
  },
  {
    id: "amoxicilina-500",
    name: "Amoxicilina 500 mg",
    category: "Receta medica",
    description: "Producto sujeto a validacion de receta antes de surtir.",
    price: 185,
    stock: 9,
    prescription: true,
    colors: ["#143ee8", "#e8edff"],
  },
];

const storageKeys = {
  cart: "minifarmacia_cart",
  user: "minifarmacia_user",
  orders: "minifarmacia_orders",
  settings: "minifarmacia_settings",
};

const state = {
  category: "Todos",
  query: "",
  cart: readJSON(storageKeys.cart, []),
  user: readJSON(storageKeys.user, null),
  orders: readJSON(storageKeys.orders, []),
  settings: readJSON(storageKeys.settings, {
    marketplaceUrl: "https://minifarmacia.mx/tienda",
    businessPhone: "5218112345678",
  }),
};

const demoCustomers = [
  { name: "Laura Martinez", phone: "81 2200 1840", email: "laura@email.com", address: "Monterrey, NL" },
  { name: "Paciente Nuevo Leon", phone: "81 1500 9000", email: "paciente@correo.com", address: "San Nicolas, NL" },
];

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const categoryTabs = $("#categoryTabs");
const productGrid = $("#productGrid");
const searchInput = $("#searchInput");
const cartButton = $("#cartButton");
const cartCount = $("#cartCount");
const cartDrawer = $("#cartDrawer");
const cartItems = $("#cartItems");
const subtotalAmount = $("#subtotalAmount");
const shippingAmount = $("#shippingAmount");
const totalAmount = $("#totalAmount");
const shippingType = $("#shippingType");
const paymentMethod = $("#paymentMethod");
const deliveryAddress = $("#deliveryAddress");
const checkoutForm = $("#checkoutForm");
const whatsappOrderLink = $("#whatsappOrderLink");
const accountButton = $("#accountButton");
const accountDialog = $("#accountDialog");
const accountForm = $("#accountForm");
const savedUser = $("#savedUser");
const ordersList = $("#ordersList");
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const incomingMessage = $("#incomingMessage");
const marketplaceUrl = $("#marketplaceUrl");
const businessPhone = $("#businessPhone");
const welcomeMessage = $("#welcomeMessage");
const copyWelcomeButton = $("#copyWelcomeButton");
const toast = $("#toast");

init();

function init() {
  hydrateSettings();
  bindEvents();
  renderCategories();
  renderProducts();
  renderAdminProducts();
  renderCart();
  renderOrders();
  renderCustomers();
  renderThreads();
  renderMetrics();
  renderSavedUser();
  seedChat();
}

function bindEvents() {
  $$(".nav-item, [data-view].primary-button").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  cartButton.addEventListener("click", openCart);
  $$("[data-close-drawer]").forEach((node) => node.addEventListener("click", closeCart));
  shippingType.addEventListener("change", () => {
    renderCart();
    persistUserShipping();
  });
  paymentMethod.addEventListener("change", renderCart);
  deliveryAddress.addEventListener("input", renderCart);
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    confirmOrder();
  });

  accountButton.addEventListener("click", () => {
    fillAccountForm();
    accountDialog.showModal();
  });

  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAccount();
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    simulateIncomingMessage();
  });

  [marketplaceUrl, businessPhone].forEach((input) => input.addEventListener("input", saveSettings));
  welcomeMessage.addEventListener("input", saveCustomWelcome);
  copyWelcomeButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildWelcomeMessage());
    showToast("Respuesta copiada");
  });
}

function showView(viewId) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
}

function hydrateSettings() {
  marketplaceUrl.value = state.settings.marketplaceUrl;
  businessPhone.value = state.settings.businessPhone;
  welcomeMessage.value = state.settings.welcomeMessage || defaultWelcomeMessage();
  if (state.user?.address) deliveryAddress.value = state.user.address;
  if (state.user?.shippingType) shippingType.value = state.user.shippingType;
}

function renderCategories() {
  const categories = ["Todos", ...new Set(products.map((product) => product.category))];
  categoryTabs.innerHTML = categories
    .map(
      (category) => `
        <button class="tab-button ${category === state.category ? "active" : ""}" type="button" data-category="${category}">
          ${category}
        </button>
      `,
    )
    .join("");

  categoryTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const filteredProducts = products.filter((product) => {
    const matchesCategory = state.category === "Todos" || product.category === state.category;
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return matchesCategory && haystack.includes(state.query);
  });

  productGrid.innerHTML =
    filteredProducts
      .map((product) => {
        const inCart = getCartLine(product.id)?.quantity || 0;
        return `
          <article class="product-card">
            <div class="product-visual" style="--visual-a:${product.colors[0]}; --visual-b:${product.colors[1]}">
              <span>${product.prescription ? "Venta con receta" : "Venta libre"}</span>
            </div>
            <div>
              <p class="product-category">${product.category}</p>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
            </div>
            <div class="product-actions">
              <strong>${currency.format(product.price)}</strong>
              <button class="primary-button small" type="button" data-add="${product.id}" ${product.stock <= inCart ? "disabled" : ""}>
                Agregar
              </button>
            </div>
          </article>
        `;
      })
      .join("") || '<div class="empty-state">No encontramos productos con esos filtros.</div>';

  productGrid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function renderAdminProducts() {
  $("#adminProductTable").innerHTML = products
    .map(
      (product) => `
        <tr>
          <td><strong>${product.name}</strong><span>${product.description}</span></td>
          <td>${product.category}</td>
          <td>${currency.format(product.price)}</td>
          <td>${product.stock}</td>
          <td><span class="status-pill">${product.prescription ? "Receta" : "Libre"}</span></td>
        </tr>
      `,
    )
    .join("");
}

function renderCustomers() {
  const customers = state.user ? [state.user, ...demoCustomers] : demoCustomers;
  $("#customerList").innerHTML = customers
    .map(
      (customer) => `
        <article class="customer-card">
          <div class="avatar">${customer.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h3>${customer.name}</h3>
            <p>${customer.phone}</p>
            <p>${customer.email}</p>
            <small>${customer.address}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderThreads() {
  const threads = [
    { name: "Laura Martinez", text: "Pregunta por envio local", status: "Abierto" },
    { name: "Paciente Nuevo Leon", text: "Recibio liga de tienda", status: "Nuevo" },
    { name: state.user?.name || "Cliente invitado", text: "Pendiente de registro", status: "Seguimiento" },
  ];
  $("#threadList").innerHTML = threads
    .map(
      (thread) => `
        <div class="thread-row">
          <div><strong>${thread.name}</strong><span>${thread.text}</span></div>
          <em>${thread.status}</em>
        </div>
      `,
    )
    .join("");
}

function renderMetrics() {
  $("#metricProducts").textContent = products.length;
  $("#metricOrders").textContent = state.orders.length;
  $("#metricCustomers").textContent = state.user ? "3" : "2";
}

function addToCart(productId) {
  const product = getProduct(productId);
  const line = getCartLine(productId);
  if (!product || (line?.quantity || 0) >= product.stock) return showToast("Sin inventario disponible");
  if (line) line.quantity += 1;
  else state.cart.push({ productId, quantity: 1 });
  persistCart();
  renderCart();
  renderProducts();
  showToast("Producto agregado");
}

function renderCart() {
  cartCount.textContent = String(state.cart.reduce((total, line) => total + line.quantity, 0));
  cartItems.innerHTML = state.cart.length
    ? state.cart
        .map((line) => {
          const product = getProduct(line.productId);
          return `
            <div class="cart-line">
              <div><h3>${product.name}</h3><p>${currency.format(product.price)} x ${line.quantity}</p></div>
              <div class="quantity-controls">
                <button type="button" data-dec="${product.id}">-</button>
                <strong>${line.quantity}</strong>
                <button type="button" data-inc="${product.id}">+</button>
              </div>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">Tu carrito esta vacio.</div>';

  cartItems.querySelectorAll("[data-inc]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(button.dataset.inc, 1));
  });
  cartItems.querySelectorAll("[data-dec]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(button.dataset.dec, -1));
  });

  const totals = calculateTotals();
  subtotalAmount.textContent = currency.format(totals.subtotal);
  shippingAmount.textContent = totals.shipping === 0 ? "Gratis" : currency.format(totals.shipping);
  totalAmount.textContent = currency.format(totals.total);
  whatsappOrderLink.href = buildWhatsAppOrderLink();
}

function changeQuantity(productId, delta) {
  const line = getCartLine(productId);
  const product = getProduct(productId);
  if (!line || !product) return;
  line.quantity += delta;
  if (line.quantity <= 0) state.cart = state.cart.filter((item) => item.productId !== productId);
  if (line.quantity > product.stock) line.quantity = product.stock;
  persistCart();
  renderCart();
  renderProducts();
}

function calculateTotals() {
  const subtotal = state.cart.reduce((total, line) => {
    const product = getProduct(line.productId);
    return total + product.price * line.quantity;
  }, 0);
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : shippingType.value === "national" ? 149 : 49;
  return { subtotal, shipping, total: subtotal + shipping };
}

function confirmOrder() {
  if (!state.cart.length) return showToast("Agrega productos antes de confirmar");
  if (!deliveryAddress.value.trim()) {
    deliveryAddress.focus();
    return showToast("Agrega una direccion de entrega");
  }

  const totals = calculateTotals();
  const order = {
    id: `MF-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    customer: state.user?.name || "Cliente sin registro",
    shippingType: shippingType.value,
    total: totals.total,
    items: state.cart.map((line) => ({
      ...line,
      productName: getProduct(line.productId).name,
      price: getProduct(line.productId).price,
    })),
  };

  state.orders.unshift(order);
  state.cart = [];
  writeJSON(storageKeys.orders, state.orders);
  persistCart();
  renderCart();
  renderOrders();
  renderMetrics();
  closeCart();
  showToast(`Pedido ${order.id} confirmado`);
}

function renderOrders() {
  ordersList.innerHTML = state.orders.length
    ? state.orders
        .map(
          (order) => `
            <article class="order-card">
              <strong>${order.id}</strong>
              <span>${order.customer}</span>
              <span>${order.shippingType === "national" ? "Nacional" : "Local"}</span>
              <b>${currency.format(order.total)}</b>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">Los pedidos confirmados apareceran aqui.</div>';
}

function fillAccountForm() {
  $("#customerName").value = state.user?.name || "";
  $("#customerPhone").value = state.user?.phone || "";
  $("#customerEmail").value = state.user?.email || "";
  $("#customerPassword").value = state.user?.password || "";
  $("#customerAddress").value = state.user?.address || deliveryAddress.value || "";
}

function saveAccount() {
  state.user = {
    name: $("#customerName").value.trim(),
    phone: $("#customerPhone").value.trim(),
    email: $("#customerEmail").value.trim(),
    password: $("#customerPassword").value,
    address: $("#customerAddress").value.trim(),
    shippingType: shippingType.value,
  };
  writeJSON(storageKeys.user, state.user);
  deliveryAddress.value = state.user.address;
  renderSavedUser();
  renderCustomers();
  renderMetrics();
  accountDialog.close();
  showToast("Cuenta guardada");
}

function renderSavedUser() {
  savedUser.textContent = state.user ? `Sesion local: ${state.user.name} - ${state.user.email}` : "";
}

function persistUserShipping() {
  if (!state.user) return;
  state.user.shippingType = shippingType.value;
  writeJSON(storageKeys.user, state.user);
}

function seedChat() {
  chatLog.innerHTML = "";
  addBubble("customer", "Hola, quiero comprar medicamento");
  addBubble("business", buildWelcomeMessage());
}

function simulateIncomingMessage() {
  const message = incomingMessage.value.trim();
  if (!message) return;
  addBubble("customer", message);
  addBubble("business", buildWelcomeMessage());
  incomingMessage.value = "";
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addBubble(type, message) {
  const node = document.createElement("div");
  node.className = `bubble ${type}`;
  node.innerHTML = `${escapeHTML(message).replaceAll("\n", "<br>")}<time>${timeNow()}</time>`;
  chatLog.appendChild(node);
}

function defaultWelcomeMessage() {
  return `Gracias por visitar Mini Farmacia. Puedes comprar en la siguiente liga: ${marketplaceUrl?.value || state.settings.marketplaceUrl}. Regístrate para guardar tus datos de entrega y dar seguimiento a tus pedidos.`;
}

function buildWelcomeMessage() {
  return (welcomeMessage.value.trim() || defaultWelcomeMessage()).replaceAll("{{liga}}", marketplaceUrl.value.trim());
}

function saveSettings() {
  state.settings.marketplaceUrl = marketplaceUrl.value.trim();
  state.settings.businessPhone = businessPhone.value.trim();
  state.settings.welcomeMessage = welcomeMessage.value.trim() || defaultWelcomeMessage();
  writeJSON(storageKeys.settings, state.settings);
}

function saveCustomWelcome() {
  state.settings.welcomeMessage = welcomeMessage.value.trim();
  writeJSON(storageKeys.settings, state.settings);
}

function buildWhatsAppOrderLink() {
  const phone = businessPhone.value.replace(/\D/g, "");
  const totals = calculateTotals();
  const lines = state.cart.map((line) => `- ${line.quantity} x ${getProduct(line.productId).name}`);
  const message = [
    "Hola, quiero confirmar este pedido de Mini Farmacia:",
    ...lines,
    `Entrega: ${shippingType.value === "national" ? "Nacional" : "Local"}`,
    `Pago: ${paymentMethod.value}`,
    `Direccion: ${deliveryAddress.value || "Por confirmar"}`,
    `Total: ${currency.format(totals.total)}`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openCart() {
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.setAttribute("aria-hidden", "true");
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
}

function getCartLine(productId) {
  return state.cart.find((line) => line.productId === productId);
}

function persistCart() {
  writeJSON(storageKeys.cart, state.cart);
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function timeNow() {
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}
